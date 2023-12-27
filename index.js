// index.js
import fetch from "node-fetch";
import readline from "readline";
import fs from "fs";
import PromptAgent from "./modules/prompt-agent.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

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

    // Verificando la respuesta de la transcripción
    console.log("Transcripción inicial obtenida.");
    console.log("transcription", transcriptionResponse);
    console.log("transcription keys", Object.keys(transcriptionResponse));

    // Concatenar todos los textos de los captions
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
    fs.writeFileSync("transcripcion_mejorada.md", improvedTranscription);
    console.log("Transcripción guardada en 'transcripcion_mejorada.md'");

    rl.close();
  });
}

main();
