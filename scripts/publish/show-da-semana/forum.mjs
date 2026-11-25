// Coleta os tópicos "Fanviews Here" do fórum oficial (community.pearljam.com, API pública Vanilla v2).
// Só o 1º post de cada tópico (setlist + notas da moderação). Grava media/show-da-semana/forum/<ano>.json,
// FORA do git (texto de terceiros, repo público). Educado: 1 chamada por segundo, User-Agent genérico.
//   node scripts/publish/show-da-semana/forum.mjs           coleta tudo
//   node scripts/publish/show-da-semana/forum.mjs --resumo  só conta o que já foi coletado
import fs from "node:fs";
import path from "node:path";
import { RAIZ } from "../../config.mjs";

const API = "https://community.pearljam.com/api/v2";
export const PASTA_FORUM = "media/show-da-semana/forum";

// "<br/>Ed thanks &amp; ..." -> texto puro com quebras de linha
export function textoPuro(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

// Data do show: título ("11/11/15", "11.22.26") ou, sem ela, o dia em que o tópico foi aberto.
export function dataDoShow(titulo, criadoEm) {
  const m = titulo.match(/(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
  if (m) {
    const ano = m[3].length === 2 ? `20${m[3]}` : m[3];
    return { data: `${ano}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`, dataPeloTitulo: true };
  }
  return { data: criadoEm.slice(0, 10), dataPeloTitulo: false };
}

export function registro(d) {
  const { data, dataPeloTitulo } = dataDoShow(d.name, d.dateInserted);
  return {
    id: d.discussionID, titulo: d.name.replace(/\*/g, "").trim(), data, dataPeloTitulo,
    eddieSolo: /\b(EV|Eddie Vedder)\b/.test(d.name), url: `https://community.pearljam.com/discussion/${d.discussionID}`,
    comentarios: d.countComments, notas: textoPuro(d.body),
  };
}

const CAB = { headers: { "User-Agent": "smufdpj-acervo/1.0", Accept: "application/json" } };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(caminho) {
  for (let i = 0; ; i++) {
    const r = await fetch(`${API}${caminho}`, CAB);
    if (r.ok) return r.json();
    if (i >= 3 || (r.status < 500 && r.status !== 429)) throw new Error(`fórum HTTP ${r.status} em ${caminho}`);
    await espera(5000 * (i + 1));
  }
}

// A busca acha os tópicos de todos os autores (a moderação não abriu todos), mas corta o texto:
// por isso cada tópico é baixado inteiro depois.
async function idsDosTopicos() {
  const ids = new Set();
  for (let n = 1; ; n++) {
    const lote = await api(`/search?query=fanviews&recordTypes=discussion&categoryID=5&limit=100&page=${n}`);
    lote.filter((d) => /fan\s?views?/i.test(d.name)).forEach((d) => ids.add(d.discussionID || d.recordID));
    if (lote.length < 100) break;
    await espera(1000);
  }
  return [...ids];
}

async function coletar() {
  const ids = await idsDosTopicos();
  const todos = [];
  for (const [i, id] of ids.entries()) {
    todos.push(registro(await api(`/discussions/${id}`)));
    process.stdout.write(`${i + 1}/${ids.length}\r`);
    await espera(700);
  }
  const porAno = {};
  for (const t of todos) (porAno[t.data.slice(0, 4)] ||= []).push(t);
  const pasta = path.join(RAIZ, PASTA_FORUM);
  fs.mkdirSync(pasta, { recursive: true });
  for (const [ano, lista] of Object.entries(porAno)) {
    lista.sort((a, b) => a.data.localeCompare(b.data));
    fs.writeFileSync(path.join(pasta, `${ano}.json`), JSON.stringify(lista, null, 1) + "\n");
  }
  return porAno;
}

function resumo() {
  const pasta = path.join(RAIZ, PASTA_FORUM);
  if (!fs.existsSync(pasta)) return console.log("nada coletado ainda");
  let total = 0;
  for (const arq of fs.readdirSync(pasta).filter((n) => /^\d{4}\.json$/.test(n)).sort()) {
    const l = JSON.parse(fs.readFileSync(path.join(pasta, arq), "utf8"));
    total += l.length;
    const ricos = l.filter((t) => t.notas.length > 1200).length;
    console.log(`${arq.slice(0, 4)}: ${l.length} shows (${l.filter((t) => t.eddieSolo).length} do Eddie solo, ${ricos} com notas longas)`);
  }
  console.log(`total: ${total}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes("--resumo")) resumo();
  else { await coletar(); console.log(); resumo(); }
}
