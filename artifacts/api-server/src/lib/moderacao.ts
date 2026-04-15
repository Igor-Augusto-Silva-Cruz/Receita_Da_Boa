/**
 * Moderação de imagens via Gemini (proxy Replit AI Integrations).
 * Usa fetch direto para suportar base URL customizada do proxy.
 */

const BASE_URL = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
const API_KEY  = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;

/**
 * Verifica se uma imagem contém conteúdo impróprio (pornografia, nudez ou violência)
 * usando o modelo gemini-3-flash-preview via proxy Replit.
 *
 * @param buffer    Buffer com os bytes da imagem
 * @param mimeType  Tipo MIME da imagem (ex: "image/jpeg")
 * @returns true se a imagem for imprópria, false caso contrário
 */
export async function verificarImagemImpropria(
  buffer: Buffer,
  mimeType: string
): Promise<boolean> {
  if (!BASE_URL || !API_KEY) {
    console.warn("AI_INTEGRATIONS_GEMINI_BASE_URL ou API_KEY não configurados — moderação ignorada.");
    return false;
  }

  const endpoint = `${BASE_URL.replace(/\/$/, "")}/v1beta/models/gemini-3-flash-preview:generateContent`;

  const body = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: buffer.toString("base64"),
            },
          },
          {
            text: 'Analise esta imagem. Ela contém pornografia, nudez explícita, genitália, atos sexuais ou violência gráfica? Responda APENAS com "SIM" ou "NAO", sem mais texto.',
          },
        ],
      },
    ],
    safetySettings: [
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HARASSMENT",         threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH",        threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT",  threshold: "BLOCK_NONE" },
    ],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 10,
    },
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Gemini moderação HTTP ${response.status}:`, errText);
      // Se for erro de segurança (400), a imagem é imprópria
      if (response.status === 400) return true;
      return false;
    }

    const data = await response.json() as any;

    // Se a resposta foi bloqueada por segurança, a imagem é imprópria
    const candidate = data?.candidates?.[0];
    if (!candidate || candidate.finishReason === "SAFETY") {
      console.warn("Gemini bloqueou análise por segurança — imagem marcada como imprópria.");
      return true;
    }

    const resposta = (candidate?.content?.parts?.[0]?.text ?? "").trim().toUpperCase();
    console.log(`Moderação Gemini: "${resposta}"`);
    return resposta.startsWith("SIM");

  } catch (err) {
    console.error("Erro na moderação de imagem via Gemini:", err);
    return false;
  }
}
