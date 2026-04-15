import { GoogleGenAI } from "@google/genai";

const BASE_URL = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
const API_KEY  = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;

let aiClient: InstanceType<typeof GoogleGenAI> | null = null;

function getClient() {
  if (!aiClient && BASE_URL && API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        apiVersion: "",
        baseUrl: BASE_URL,
      },
    });
  }
  return aiClient;
}

/**
 * Verifica se uma imagem contém conteúdo impróprio (pornografia, nudez ou violência)
 * usando gemini-2.5-flash via proxy Replit AI Integrations.
 */
export async function verificarImagemImpropria(
  buffer: Buffer,
  mimeType: string
): Promise<boolean> {
  const ai = getClient();
  if (!ai) {
    console.warn("[Moderação] Gemini não configurado — moderação ignorada.");
    return false;
  }

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
              text: 'Esta imagem contém pornografia, nudez explícita, genitália, atos sexuais ou violência gráfica? Responda APENAS com "SIM" ou "NAO", sem mais texto.',
            },
          ],
        },
      ],
      config: {
        temperature: 0,
        maxOutputTokens: 50,
      },
    });

    // Log completo para diagnóstico
    console.log("[Moderação] resposta completa:", JSON.stringify(result).slice(0, 500));

    const candidate = result.candidates?.[0];
    const finishReason = candidate?.finishReason;

    // Bloqueado por segurança = imagem imprópria
    if (finishReason === "SAFETY" || finishReason === "PROHIBITED_CONTENT") {
      console.warn("[Moderação] Bloqueado por segurança — imagem imprópria.");
      return true;
    }

    // Extrai texto de todos os parts
    const parts = candidate?.content?.parts ?? [];
    const resposta = parts
      .map((p: any) => p.text ?? "")
      .join("")
      .trim()
      .toUpperCase();

    console.log(`[Moderação] finishReason=${finishReason} | resposta="${resposta}"`);
    return resposta.startsWith("SIM");

  } catch (err: any) {
    const msg = err?.message ?? String(err);
    if (msg.includes("SAFETY") || msg.includes("blocked") || msg.includes("PROHIBITED")) {
      console.warn("[Moderação] Gemini recusou — imagem imprópria.");
      return true;
    }
    console.error("[Moderação] Erro técnico:", msg);
    return false;
  }
}
