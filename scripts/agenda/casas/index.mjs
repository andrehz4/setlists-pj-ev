// Casas de show (media/agenda/casas.json): post de COLABORAÇÃO (casa + banda) só aparece no feed de quem publicou, e a
// API lê só o feed da própria conta. Show da Love Boat no Studio Rock Café (14/11/2026) escapou assim. Aqui a coleta lê
// as casas e entrega à banda os posts que citam o @ dela (a API tira o @: vem "loveboat_tribute" colado no texto).
// Desliga com AGENDA_CASAS=0. Casa que falhar na leitura é pulada (nunca derruba a coleta).
import { lerEstado } from "../../lib/estado.mjs";
import { naRaiz } from "../../config.mjs";
import { lerConta } from "../ler-instagram.mjs";

export const CASAS = naRaiz("media/agenda/casas.json");
const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const citaConta = (legenda, conta) => new RegExp(`(?<![\\w.])@?${esc(conta)}(?![\\w]|\\.\\w)`, "i").test(legenda || "");

// Agenda da CASA com vários dias (um bloco por dia, separados por linha em branco): a banda fica só com o bloco que
// cita ela. Santo Rock 23/11/2026: "QUINTA | 26/11 – QROCK ... SEXTA | 27/11 – ... Blaymorphed" virou show na quinta.
// Na dúvida devolve null: o post é ignorado, nunca chuta data. Com data escrita, a FRASE que tem a data precisa citar a
// banda ("Ontem teve Blaymorphed! Sábado 28/11 tem QROCK" não vira show da Blaymorphed no dia 28).
const DATAS = /\b\d{1,2}[/.]\d{1,2}\b/g;
const nDatas = (t) => new Set(t.match(DATAS) || []).size;
const frases = (t) => t.split(/[!?]+|\.(?=\s)/);
export function trechoDaBanda(legenda, conta) {
  const texto = String(legenda || "");
  if (nDatas(texto) === 0) return texto; // sem data escrita: a prova da data segura o show
  const dela = texto.split(/\n\s*\n/).filter((b) => nDatas(b) === 1
    && frases(b).some((f) => nDatas(f) === 1 && citaConta(f, conta)));
  return dela.length === 1 ? dela[0] : null;
}

// posts lidos de cada casa -> Map(conta da banda -> [post com casaDona]). Função pura, testada.
export function distribuirPosts(lidas, bandas) {
  const porBanda = new Map();
  for (const { casa, posts } of lidas) for (const p of posts) for (const b of bandas) {
    if (b.conta === casa.conta || !citaConta(p.legenda, b.conta)) continue;
    const legenda = trechoDaBanda(p.legenda, b.conta);
    if (legenda === null) { console.warn(`[agenda] post de @${casa.conta} com várias datas ignorado pra @${b.conta}: ${p.link}`); continue; }
    (porBanda.get(b.conta) || porBanda.set(b.conta, []).get(b.conta)).push({ ...p, legenda, imagens: [], casaDona: casa });
  }
  return porBanda;
}

export async function postsDasCasas(bandas, { env = process.env, ler = lerConta, n = 15 } = {}) {
  if (env.AGENDA_CASAS === "0") return new Map();
  const { casas } = await lerEstado(CASAS, { casas: [] });
  const lidas = [];
  for (const casa of casas) {
    try { lidas.push({ casa, posts: (await ler(casa.conta, { n, env })).posts }); }
    catch (e) { console.warn(`[agenda] casa @${casa.conta} pulada: ${e.message}`); }
  }
  const porBanda = distribuirPosts(lidas, bandas);
  for (const [b, ps] of porBanda) console.log(`[agenda] @${b}: ${ps.length} post(s) de casa (${[...new Set(ps.map((p) => p.casaDona.conta))].join(", ")})`);
  return porBanda;
}
