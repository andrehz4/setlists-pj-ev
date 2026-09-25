// Chamada ao Gemini: assiste o vídeo (com áudio) ou olha as fotos, lê texto e legenda,
// e devolve a análise em JSON estruturado. Critério em prompt-curadoria.md.

import { readFile } from "node:fs/promises";
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODELO = process.env.CONTRIB_GEMINI_MODEL || process.env.GEMINI_MODEL || "gemini-2.5-flash";
const STATUS = { type: "string", enum: ["ok", "violada", "incerto"] };
const REGRA = { type: "object", properties: { status: STATUS, obs: { type: "string" } }, required: ["status"] };

const SCHEMA = {
  type: "object",
  properties: {
    regras: {
      type: "object",
      properties: { musica: REGRA, tema: REGRA, respeito: REGRA },
      required: ["musica", "tema", "respeito"],
    },
    fatos: {
      type: "array",
      items: {
        type: "object",
        properties: {
          afirmacao: { type: "string" },
          status: { type: "string", enum: ["certa", "errada", "incerta"] },
          correcao: { type: "string" },
        },
        required: ["afirmacao", "status"],
      },
    },
    decisao: { type: "string", enum: ["aprovado", "ajustado", "recusado"] },
    titulo: { type: "string" },
    texto: { type: "string" },
    legendas: { type: "array", items: { type: "string" } },
    motivo: { type: "string" },
    resumo: { type: "string", description: "1 frase pro Andre explicando a decisão" },
  },
  required: ["regras", "fatos", "decisao", "titulo", "texto", "resumo"],
  propertyOrdering: ["regras", "fatos", "decisao", "titulo", "texto", "legendas", "motivo", "resumo"],
};

export function montarPedido(envio) {
  const legendas = envio.video?.legendas || [];
  return [
    `Tipo: ${envio.video ? "vídeo (já cortado, com o áudio original)" : `${envio.media.length} foto(s)`}`,
    `Título: ${envio.title}`,
    `Texto:\n${envio.body}`,
    envio.video
      ? `Estilo da legenda: ${envio.video.estilo}\nLegenda (${legendas.length} linhas, devolva todas na mesma ordem):\n${legendas.map((l, i) => `${i + 1}. ${l.text}`).join("\n") || "(sem linhas)"}`
      : "Sem vídeo: a regra 1 (música) fica ok.",
  ].join("\n\n");
}

export async function avaliar(envio, partesMidia) {
  const chave = process.env.GEMINI_API_KEY;
  if (!chave) throw new Error("GEMINI_API_KEY não definida");
  const sistema = await readFile(new URL("./prompt-curadoria.md", import.meta.url), "utf8");
  const modelo = new GoogleGenerativeAI(chave).getGenerativeModel({
    model: MODELO,
    systemInstruction: sistema,
    generationConfig: { temperature: 0.2, maxOutputTokens: 8000, responseMimeType: "application/json", responseSchema: SCHEMA },
  });
  const resp = await modelo.generateContent([...partesMidia, { text: montarPedido(envio) }]);
  const texto = resp.response?.text?.()?.trim();
  if (!texto) throw new Error("Gemini devolveu resposta vazia");
  return JSON.parse(texto);
}
