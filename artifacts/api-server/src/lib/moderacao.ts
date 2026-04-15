import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Verifica se uma imagem contém conteúdo impróprio (pornografia, nudez ou violência)
 * usando o modelo Gemini 2.0 Flash.
 *
 * @param buffer  Buffer com os bytes da imagem
 * @param mimeType  Tipo MIME da imagem (ex: "image/jpeg")
 * @returns true se a imagem for imprópria, false caso contrário
 */
export async function verificarImagemImpropria(
  buffer: Buffer,
  mimeType: string
): Promise<boolean> {
  if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY não configurada — moderação de imagem ignorada.");
    return false;
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT,         threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,        threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,  threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: buffer.toString("base64"),
        },
      },
      {
        text: 'Analise esta imagem e responda APENAS com "SIM" se ela contiver pornografia, nudez explícita, genitália, atos sexuais ou violência gráfica. Responda APENAS com "NAO" se for uma imagem comum e apropriada. Não escreva mais nada além de SIM ou NAO.',
      },
    ]);

    const candidate = result.response.candidates?.[0];

    // Se o Gemini bloqueou a resposta por segurança, a imagem é imprópria
    if (!candidate || candidate.finishReason === "SAFETY") {
      console.warn("Gemini bloqueou a análise por segurança — imagem marcada como imprópria.");
      return true;
    }

    const resposta = candidate.content?.parts?.[0]?.text?.trim().toUpperCase() ?? "";
    console.log(`Moderação Gemini: "${resposta}"`);
    return resposta.startsWith("SIM");

  } catch (err: any) {
    // Se o Gemini se recusar a processar por segurança, bloqueia
    if (
      err?.message?.includes("SAFETY") ||
      err?.message?.includes("blocked") ||
      err?.status === 400
    ) {
      console.warn("Gemini recusou processar imagem por segurança — bloqueando.");
      return true;
    }
    console.error("Erro na moderação de imagem via Gemini:", err);
    // Outros erros técnicos (rede, quota, etc.) não bloqueiam o upload
    return false;
  }
}
