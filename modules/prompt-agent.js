import OpenAi from "openai";

export class PromptAgent {
  constructor() {}

  async improveTranscription({ transcription }) {
    const openai = new OpenAi(process.env.OPENAI_API_KEY);
    console.log("por consultar a gpt.,..");
    console.log("transcription original: ", transcription);
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Analiza minuciosamente la transcripción proporcionada, identifica los temas y puntos cruciales, y escribe un resumen en formato Markdown. Asegúrate de utilizar las herramientas de formato para resaltar información relevante y dividir el resumen en secciones y subsecciones numeradas. Proporciona resúmenes breves para cada sección y destaca los hitos primordiales con citas textuales. Verifica que el documento final esté en el formato Markdown correcto`,
        },
        {
          role: "user",
          content: `
Siguiendo fielmente cada frase que te instruyo. Haz cada paso meticulosamente. Dale el respectivo honor a cada frase y cúmplela.
Aquí te entrego la siguiente transcripción de un diálogo que debes analizar:
<<<
${transcription}
>>>
Haz una lectura minuciosa de cada línea, asegúrate de interiorizar la esencia de la conversación. Respira profundo. Ahora, realiza una segunda lectura tratando de penetrar aún más en los detalles y puntos sutiles que podrías haber dejado pasar en la primera lectura.
Tu reto es extraer los temas primordiales que se expresan en esta transcripción. Identifica y pone de relieve las frases y puntos cruciales. No pierdas de vista las áreas donde se presenten ambigüedades o dudas.
Una vez pasado este punto, debes condensar toda esta información en un resumen sistemático y de fácil comprensión, utilizando el formato Markdown. Debes puntualizar de manera explícita los tópicos más relevantes y mantener una estructura de fácil seguimiento en el resumen.
Haz uso de las herramientas de formato que te ofrece Markdown para realzar la información más valiosa. Usa **Negrita** para los temas de mayor peso, *Cursiva* para información complementaria pero que no deja de ser relevante y \`código\` para elementos que ameriten un tratamiento distinto.
Respira hondo de nuevo. Una vez que hayas asimilado en su totalidad la transcripción, empieza a dividir el resumen en secciones y subsecciones. Enumera cada una de ellas.
Para cada una de las secciones y subsecciones que se han trazado, redacta un breve resumen que encapsule la esencia de la información tratada allí.
Finalmente, resalta los hitos más notables del diálogo proporcionando las citas textuales que hayas identificado durante tu análisis.
Asegúrate de que este contenido se ajuste correctamente al formato Markdown y esté correctamente señalado en el documento final.
Respira nuevamente. Date una palmada en la espalda por el trabajo bien hecho hasta ahora y cierra la tarea siguiendo al pie de la letra estas instrucciones hasta el final.`,
        },
      ],
      model: "gpt-4",
    });

    console.log(`Siguiendo fielmente cada frase que te instruyo. Haz cada paso meticulosamente. Dale el respectivo honor a cada frase y cúmplela.
      Aquí te entrego la siguiente transcripción de un diálogo que debes analizar:
      <<<
      ${transcription}
      >>>
      Haz una lectura minuciosa de cada línea, asegúrate de interiorizar la esencia de la conversación. Respira profundo. Ahora, realiza una segunda lectura tratando de penetrar aún más en los detalles y puntos sutiles que podrías haber dejado pasar en la primera lectura.
      Tu reto es extraer los temas primordiales que se expresan en esta transcripción. Identifica y pone de relieve las frases y puntos cruciales. No pierdas de vista las áreas donde se presenten ambigüedades o dudas.
      Una vez pasado este punto, debes condensar toda esta información en un resumen sistemático y de fácil comprensión, utilizando el formato Markdown. Debes puntualizar de manera explícita los tópicos más relevantes y mantener una estructura de fácil seguimiento en el resumen.
      Haz uso de las herramientas de formato que te ofrece Markdown para realzar la información más valiosa. Usa **Negrita** para los temas de mayor peso, *Cursiva* para información complementaria pero que no deja de ser relevante y \`código\` para elementos que ameriten un tratamiento distinto.
      Respira hondo de nuevo. Una vez que hayas asimilado en su totalidad la transcripción, empieza a dividir el resumen en secciones y subsecciones. Enumera cada una de ellas.
      Para cada una de las secciones y subsecciones que se han trazado, redacta un breve resumen que encapsule la esencia de la información tratada allí.
      Finalmente, resalta los hitos más notables del diálogo proporcionando las citas textuales que hayas identificado durante tu análisis.
      Asegúrate de que este contenido se ajuste correctamente al formato Markdown y esté correctamente señalado en el documento final.
      Respira nuevamente. Date una palmada en la espalda por el trabajo bien hecho hasta ahora y cierra la tarea siguiendo al pie de la letra estas instrucciones hasta el final.`);
    console.log("completion", completion);
    console.log(completion.choices[0]);

    return completion.choices[0].message.content;
  }
}

export default PromptAgent;
