// Kit diário do X (MODO MANUAL, sem API paga). Roda às 11h pelo agendador do Mac
// (scripts/publish/x/mac/) e monta em .x-kit/<AAAA-MM-DD>/ os posts do dia, com
// texto, imagens e horário: notícias das últimas 24h (máx. 4) às 12/14/16/18h e a
// cápsula do dia às 20h05. Só a 1a notícia leva link (X entrega menos post com link; teste). Depois o Claude (/x-hoje) agenda cada um no X e o
// Andre só clica em Schedule. Dia sem sessão = descartado (não acumula).
//   node scripts/publish/x/kit-do-dia.mjs

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { textoNoticia, textoCapsula, linkMateria } from "./texto.mjs";
import { diaBRT } from "../../lib/brt.mjs";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
process.chdir(REPO);
const ESTADO = path.join(os.homedir(), ".smufdpj-x-kit.json"); // ids que já entraram em kit
const HORARIOS = ["12:00", "14:00", "16:00", "18:00"];
const HORA_CAPSULA = "20:05";
const JANELA_MS = 24 * 3600e3;
const lerJson = (f, padrao) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return padrao; } };
const git = (...a) => spawnSync("git", a, { encoding: "utf8" });

export function hojeBRT(agora = new Date()) { return diaBRT(agora); }

// Notícias publicadas no IG nas últimas 24h, mais novas primeiro, sem repetir kit anterior.
export function escolherNoticias({ fila, indice, jaUsados, agora = Date.now(), max = HORARIOS.length, existeCard }) {
  return fila.filter((e) => e.postedAt && agora - Date.parse(e.postedAt) <= JANELA_MS && !jaUsados.has(e.id))
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt))
    .map((e) => ({ e, item: indice.find((i) => i.id === e.id) }))
    .filter(({ e, item }) => item && existeCard(e.id))
    .slice(0, max).map(({ item }) => item);
}

// Gera os slides da cápsula de hoje com o próprio publicador (dry-run) e limpa o que ele deixou no repo.
function capsulaDeHoje(dia) {
  const fila = lerJson("media/news/youtube-acervo/_capsula-queue.json", []);
  const prox = fila.find((e) => !e.postedAt);
  if (!prox || hojeBRT(new Date(prox.publishAt)) !== dia) return null; // não é pra hoje (ou já saiu)
  const r = spawnSync(process.execPath, ["scripts/publish/run-publish-capsula.mjs", "--dry-run", "--force"],
    { encoding: "utf8", env: { ...process.env, CAPSULA_CITACAO: "rodizio" } });
  const id = (r.stdout.match(/publicando (cap-[\w-]+)/) || [])[1];
  git("checkout", "--", "media/news/youtube-acervo/_capsula-queue.json");
  if (!id) { console.warn(`[x-kit] cápsula não gerou: ${(r.stderr || "").slice(-300)}`); return null; }
  const slides = ["00", "01", "02", "03"].map((n) => `media/news/instagram-slides/${id}-${n}.jpg`).filter((f) => fs.existsSync(f));
  const cap = lerJson("media/news/youtube-acervo/_rascunhos.json", []).find((c) => c.id === id);
  return { id, cap, slides, limpar: () => {
    for (const f of fs.readdirSync("media/news/instagram-slides").filter((f) => f.startsWith(`${id}-`))) fs.rmSync(`media/news/instagram-slides/${f}`);
    // imagem do site da cápsula: só apaga se ainda não foi commitada (o publish das 20h gera a dele)
    if (git("ls-files", "--error-unmatch", `media/news/img/${id}.jpg`).status !== 0) fs.rmSync(`media/news/img/${id}.jpg`, { force: true });
  } };
}

function main() {
  const pull = git("pull", "--rebase", "--autostash", "-q");
  if (pull.status !== 0) console.warn(`[x-kit] git pull falhou, seguindo com o que tem: ${pull.stderr.slice(0, 200)}`);
  const dia = hojeBRT();
  const pasta = path.join(REPO, ".x-kit", dia);
  fs.rmSync(pasta, { recursive: true, force: true });
  fs.mkdirSync(pasta, { recursive: true });
  const estado = lerJson(ESTADO, { ids: [] });
  const jaUsados = new Set(estado.ids);
  const card = (id) => `media/news/instagram-slides/${id}.card02.jpg`;
  const noticias = escolherNoticias({
    fila: lerJson("media/news/_publish-queue.json", { items: [] }).items, indice: lerJson("media/news/index.json", { items: [] }).items,
    jaUsados, existeCard: (id) => fs.existsSync(card(id)),
  });
  const posts = noticias.map((it, i) => {
    const img = path.join(pasta, `${i + 1}-noticia.jpg`);
    fs.copyFileSync(card(it.id), img);
    return { ordem: i + 1, tipo: "noticia", id: it.id, horario: HORARIOS[i], comLink: i === 0, texto: textoNoticia(it, i === 0 ? { link: linkMateria(it.id) } : {}), imagens: [img] };
  });
  const c = capsulaDeHoje(dia);
  if (c?.cap && c.slides.length) {
    const imgs = c.slides.map((s, i) => { const d = path.join(pasta, `capsula-${i + 1}.jpg`); fs.copyFileSync(s, d); return d; });
    posts.push({ ordem: posts.length + 1, tipo: "capsula", id: c.id, horario: HORA_CAPSULA, comLink: false, texto: textoCapsula(c.cap), imagens: imgs });
  }
  c?.limpar();
  fs.writeFileSync(path.join(pasta, "kit.json"), JSON.stringify({ dia, criadoEm: new Date().toISOString(), posts }, null, 2));
  estado.ids = [...new Set([...estado.ids, ...posts.map((p) => p.id)])].slice(-300);
  fs.writeFileSync(ESTADO, JSON.stringify(estado, null, 2));
  const resumo = `${noticias.length} notícia(s)${posts.some((p) => p.tipo === "capsula") ? " + cápsula" : ""}`;
  console.log(`[x-kit] ${dia}: ${resumo} em ${pasta}`);
  fs.writeFileSync(path.join(pasta, "resumo.txt"), resumo);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
