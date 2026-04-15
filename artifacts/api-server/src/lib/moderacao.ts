import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Verifica se uma imagem contém conteúdo impróprio (nudez ou violência)
 * usando o modelo Gemini 1.5 Flash.
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: buffer.toString("base64"),
        },
      },
      {
        text: 'Esta imagem contém conteúdo impróprio como nudez explícita ou cenas de violência? Responda apenas com "SIM" ou "NAO".',
      },
    ]);

    const resposta = result.response.text().trim().toUpperCase();
    return resposta.startsWith("SIM");
  } catch (err) {
    console.error("Erro na moderação de imagem via Gemini:", err);
    // Em caso de falha na API, deixa passar para não bloquear usuários
    return false;
  }
}
