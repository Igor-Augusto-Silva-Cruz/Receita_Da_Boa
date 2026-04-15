import { GoogleGenAI } from "@google/genai";

const BASE_URL = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
const API_KEY  = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;

/**
 * Verifica se uma imagem contém conteúdo impróprio (pornografia, nudez ou violência)
 * usando gemini-3-flash-preview via proxy Replit AI Integrations.
 */
export async function verificarImagemImpropria(
  buffer: Buffer,
  mimeType: string
): Promise<boolean> {
  if (!BASE_URL || !API_KEY) {
    console.warn("Gemini não configurado — moderação ignorada.");
    return false;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        apiVersion: "",
        baseUrl: BASE_URL,
      },
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: buffer.toString("base64"),
              },
            },
            {
              text: 'Analise esta imagem. Ela contém pornografia, nudez explícita, genitália, atos sexuais ou violência gráfica? Responda APENAS com "SIM" ou "NAO", sem mais texto.',
            },
          ],
        },
      ],
      config: {
        temperature: 0,
        maxOutputTokens: 10,
      },
    });

    const candidate = response.candidates?.[0];

    // Se o Gemini bloqueou por segurança, a imagem é imprópria
    if (!candidate || candidate.finishReason === "SAFETY") {
      console.warn("Gemini bloqueou análise — imagem marcada como imprópria.");
      return true;
    }

    const resposta = (candidate.content?.parts?.[0]?.text ?? "").trim().toUpperCase();
    console.log(`Moderação Gemini: "${resposta}"`);
    return resposta.startsWith("SIM");

  } catch (err: any) {
    if (err?.message?.includes("SAFETY") || err?.message?.includes("blocked")) {
      console.warn("Gemini recusou a imagem por segurança — bloqueando.");
      return true;
    }
    console.error("Erro na moderação de imagem via Gemini:", err?.message ?? err);
    return false;
  }
}
