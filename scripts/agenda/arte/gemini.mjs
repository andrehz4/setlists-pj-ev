// Lê o texto da arte de agenda com o Gemini (visão). Baixa as imagens do post só em memória (nunca salva nem
// publica) e devolve {shows:[{dia, mes, hora, casa, cidade, uf, observacao}]}.
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODELO = process.env.AGENDA_ARTE_MODEL || process.env.GEMINI_MODEL || "gemini-2.5-flash";
const STR = { type: "string" };
const SCHEMA = {
  type: "object",
  properties: {
    shows: {
      type: "array",
      items: {
        type: "object",
        properties: { dia: { type: "integer" }, mes: { type: "integer" }, hora: STR, casa: STR, cidade: STR, uf: STR, observacao: STR },
        required: ["dia", "mes"],
      },
    },
  },
  required: ["shows"],
};

const pedido = (banda, dataPost) => [
  `Estas imagens são de um post do Instagram da banda cover "${banda.nome}" (@${banda.conta}), de ${banda.cidade || "?"}/${banda.uf || "?"}, publicado em ${dataPost.slice(0, 10)}.`,
  "Leia o texto das imagens e liste os shows DESTA banda que aparecem na arte (agenda).",
  "Regras: só o que está escrito na imagem, nunca invente. Datas de outros artistas citadas (ex.: shows do Eddie Vedder",
  "ou do Pearl Jam que a banda vai assistir) NÃO entram. Sem agenda na imagem = lista vazia.",
  "dia e mes em número. hora como '21h' ou '21h30' (vazio se não tiver). casa: o @ da casa sem o @ se aparecer,",
  "senão o nome da casa como está escrito. cidade e uf (sigla de 2 letras) se aparecerem. observacao: nome do projeto",
  "ou formato do show se a arte disser (ex.: 'Into The Wild', 'acústico', 'evento fechado').",
].join("\n");

export async function lerArteGemini(imagens, { banda, dataPost, env = process.env, fetchImpl = fetch }) {
  if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY ausente");
  const partes = [];
  for (const url of imagens) {
    const r = await fetchImpl(url, { signal: AbortSignal.timeout(20000) });
    if (!r.ok) throw new Error(`imagem HTTP ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    partes.push({ inlineData: { mimeType: r.headers.get("content-type") || "image/jpeg", data: buf.toString("base64") } });
  }
  const modelo = new GoogleGenerativeAI(env.GEMINI_API_KEY).getGenerativeModel({
    model: MODELO,
    generationConfig: { temperature: 0, maxOutputTokens: 4000, responseMimeType: "application/json", responseSchema: SCHEMA },
  });
  const resp = await modelo.generateContent([...partes, { text: pedido(banda, dataPost) }]);
  const texto = resp.response?.text?.()?.trim();
  if (!texto) throw new Error("Gemini devolveu resposta vazia");
  return JSON.parse(texto);
}
