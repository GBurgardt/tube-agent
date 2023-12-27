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
    res.send(`
        <html>
          <head>
            <title>Transcripción Mejorada</title>
            <style>
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                background-color: #f4f4f4;
                color: #333;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: -20px 0 50px;
              }
              .card {
                box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
                transition: 0.3s;
                background-color: #fff;
                border-radius: 5px;
                padding: 20px;
                margin: 20px;
                width: 80%;
                max-width: 700px;
              }
              .card:hover {
                box-shadow: 0 8px 16px 0 rgba(0,0,0,0.2);
              }
              .content {
                margin: 15px;
              }
              .nav-buttons {
                text-align: center;
                margin-top: 20px;
              }
              #prev, #next {
                cursor: pointer;
                background-color: #e7e7e7;
                color: black;
                border: none;
                padding: 10px 20px;
                text-align: center;
                text-decoration: none;
                display: inline-block;
                font-size: 18px;
                margin: 4px 2px;
                transition-duration: 0.4s;
                border-radius: 5px;
                box-shadow: 0 2px 5px 0 rgba(0,0,0,0.2);
              }
              #prev:hover, #next:hover {
                background-color: #ddd;
                box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
              }
            </style>
            <script>
              document.addEventListener('DOMContentLoaded', (event) => {
                let currentSection = 0;
                const sections = ${JSON.stringify(htmlSections)};
                const contentDiv = document.getElementById('content');
                
                function showSection(index) {
                  contentDiv.innerHTML = sections[index];
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
          </head>
          <body>
            <div class="card">
              <div id="content" class="content"></div>
              <div class="nav-buttons">
                <button id="prev">← Prev</button>
                <button id="next">Next →</button>
              </div>
            </div>
          </body>
        </html>
      `);
  });

  app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
  });
}

main();
