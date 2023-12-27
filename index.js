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

// Configurar express para servir archivos estáticos del directorio 'public'
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

    // Iniciar el servidor para mostrar la transcripción
    startServer(improvedTranscriptionMarkdown);

    rl.close();
  });
}

function startServer(markdownContent) {
  app.get("/", (req, res) => {
    const htmlContent = marked(markdownContent);
    res.send(
      `<html><head><title>Transcripción Mejorada</title></head><body>${htmlContent}</body></html>`
    );
  });

  app.listen(port, () => {
    console.log(`Servidor ejecutándose en http://localhost:${port}`);
  });
}

main();
