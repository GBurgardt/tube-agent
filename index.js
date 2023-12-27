import fetch from "node-fetch";
import readline from "readline";
import fs from "fs";
import express from "express";
import { marked } from "marked";
import PromptAgent from "./modules/prompt-agent.js";

const app = express();
const port = 3000;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

app.use(express.static("public"));

async function getTranscription({ videoUrl, langCode }) {
  const response = await fetch(
    "https://tactiq-apps-prod.tactiq.io/transcript",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ videoUrl: videoUrl, langCode: langCode }),
    }
  );
  return response.json();
}

async function main() {
  console.log("Bienvenido a la aplicación de transcripción de video.");

  rl.question("Ingrese la URL del video de YouTube: ", async url => {
    console.log("Obteniendo transcripción...");
    const transcriptionResponse = await getTranscription({
      videoUrl: url,
      langCode: "es",
    });

    console.log("Transcripción inicial obtenida.");
    const fullTranscription = transcriptionResponse.captions
      .map(caption => caption.text)
      .join(" ");

    console.log("Transcripción completa creada.");
    const promptAgent = new PromptAgent(process.env.OPENAI_API_KEY);
    console.log("Mejorando transcripción con GPT-4...");
    const improvedTranscription = await promptAgent.improveTranscription({
      transcription: fullTranscription,
    });

    console.log("Transcripción optimizada.");
    const improvedTranscriptionMarkdown = `# Transcripción Mejorada\n\n${improvedTranscription}`;
    fs.writeFileSync(
      "transcripcion_mejorada.md",
      improvedTranscriptionMarkdown
    );
    console.log("Transcripción guardada en 'transcripcion_mejorada.md'");

    // En la función main(), antes de llamar a startServer():
    const listType = detectListType(improvedTranscriptionMarkdown);
    const htmlSections = splitIntoSections(
      improvedTranscriptionMarkdown,
      listType
    );

    // Iniciar el servidor para mostrar la transcripción
    startServer(htmlSections);

    rl.close();
  });
}

// Función para detectar el tipo de numeración utilizado (arábigos o romanos)
function detectListType(markdownContent) {
  const arabicPattern = /^\d+\./m;
  const romanPattern = /^[IVXLCDM]+\./m;

  if (arabicPattern.test(markdownContent)) {
    return "arabic";
  } else if (romanPattern.test(markdownContent)) {
    return "roman";
  }
  return null;
}

// Función para dividir el contenido en secciones y subsecciones
function splitIntoSections(markdownContent) {
  // Primero, dividimos las secciones principales
  const mainSections = markdownContent
    .split(/\n(?=##\s\d+\. )/)
    .filter(Boolean);

  // Luego, dentro de cada sección, dividimos las subsecciones si las hay
  return mainSections.map(section => {
    const subSections = section.split(/\n(?=###\s\d+\.\d+\s)/).filter(Boolean);
    // Ahora, convertimos cada sección o subsección a HTML
    return subSections.map(subSection => marked(subSection)).join("");
  });
}

function startServer(htmlSections) {
  app.get("/", (req, res) => {
    res.send(
      `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Transcripción Mejorada</title>
          <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap" rel="stylesheet">
          <style>
            * {
              box-sizing: border-box;
            }
            body { 
              font-family: 'Roboto', sans-serif;
              margin: 0;
              background-color: #F7F9FB;
              color: #333;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 40px 20px;
            }
            .container {
              width: 100%;
              max-width: 700px;
              margin: 0 auto;
              padding: 20px;
              background: #FFFFFF;
              border-radius: 8px;
              box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.05);
            }
            .header {
              width: 100%;
              padding: 15px 20px;
              background: #FFFFFF;
              margin-bottom: 20px;
              box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
              border-radius: 8px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 1.8rem;
              color: #333;
            }
            .content {
              margin-bottom: 20px;
            }
            .nav-buttons {
              display: flex;
              justify-content: space-between;
              padding-top: 20px;
            }
            .button {
              padding: 10px 20px;
              background: none;
              color: #333;
              border: 2px solid #333;
              border-radius: 5px;
              font-size: 1rem;
              cursor: pointer;
              transition: all 0.3s ease;
            }
            .button:hover {
              background: #333;
              color: white;
            }
            .section-indicator {
              font-size: 1rem;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            
            <div id="content" class="content"></div>
            <div class="nav-buttons">
              <button id="prev" class="button">← Prev</button>
              <span id="section-indicator" class="section-indicator">1/${
                htmlSections.length
              }</span>
              <button id="next" class="button">Next →</button>
            </div>
          </div>
          <script>
            document.addEventListener('DOMContentLoaded', (event) => {
              let currentSection = 0;
              const sections = ${JSON.stringify(htmlSections)};
              const contentDiv = document.getElementById('content');
              const sectionIndicator = document.getElementById('section-indicator');
              
              function showSection(index) {
                contentDiv.innerHTML = sections[index];
                sectionIndicator.textContent = ` +
        "`${index + 1}/${sections.length}`" +
        `;
                document.getElementById('prev').style.visibility = index > 0 ? 'visible' : 'hidden';
                document.getElementById('next').style.visibility = index < sections.length - 1 ? 'visible' : 'hidden';
              }
  
              document.getElementById('prev').addEventListener('click', () => {
                if (currentSection > 0) {
                  showSection(--currentSection);
                }
              });
  
              document.getElementById('next').addEventListener('click', () => {
                if (currentSection < sections.length - 1) {
                  showSection(++currentSection);
                }
              });
  
              showSection(currentSection);
            });
          </script>
        </body>
        </html>
      `
    );
  });

  app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
  });
}

main();
