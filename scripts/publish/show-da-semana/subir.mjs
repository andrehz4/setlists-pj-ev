// Mac: monta/atualiza a fila (media/show-da-semana/_fila.json) a partir da agenda, renderiza os 4 slides de cada
// post da API que ainda não tem link e sobe pro R2 (pasta especiais/, que NÃO apaga sozinha; reels/ e stories/
// apagam em 3 dias). Nome com hash do conteúdo: re-render vira link novo (a borda guarda cada URL por 4 h).
//   node scripts/publish/show-da-semana/subir.mjs            (sobe o que falta)
//   node scripts/publish/show-da-semana/subir.mjs --so-fila  (só monta a fila, sem render nem R2)
//   node scripts/publish/show-da-semana/subir.mjs --refazer 12   (re-renderiza e re-sobe o #12)
// Precisa do Chrome, das fontes (npm run fontes:mac) e do `npx wrangler login` feito uma vez. Depois: commitar a fila.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { RAIZ } from "../../config.mjs";
import { lerEstado, gravarEstado } from "../../lib/estado.mjs";
import { BUCKET, BASE_PUBLICA } from "../reel/acervo-r2.mjs";
import { renderizar } from "./render.mjs";
import { caminhoFicha, validar } from "./ficha.mjs";
import { caminhoFila, validaFila, montarFila, ARQ_AGENDA } from "./fila.mjs";

const PREFIXO = "especiais/show-da-semana";
const SAIDA = path.join(os.tmpdir(), "smufdpj-show-da-semana");

export function chaveDoSlide(n, i, corpo) {
  const h = crypto.createHash("sha256").update(corpo).digest("hex").slice(0, 12);
  return `${PREFIXO}/${String(n).padStart(2, "0")}/${String(i + 1).padStart(2, "0")}-${h}.jpg`;
}

function wranglerPut(local, chave) {
  const r = spawnSync("npx", ["--yes", "wrangler@latest", "r2", "object", "put", `${BUCKET}/${chave}`,
    "--file", local, "--content-type", "image/jpeg", "--remote"], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`wrangler falhou em ${chave}: ${(r.stderr || r.stdout || "").slice(-300)}`);
}

// Confere pelo link público que o arquivo no ar é o mesmo gerado (hash do conteúdo).
function conferePublico(url, corpo) {
  const destino = path.join(SAIDA, `._conf-${Date.now()}.jpg`);
  for (let i = 0; i < 5; i++) {
    const r = spawnSync("curl", ["-sfL", "--max-time", "60", "-o", destino, `${url}?v=${Date.now()}`]);
    if (r.status === 0 && fs.readFileSync(destino).equals(corpo)) { fs.rmSync(destino, { force: true }); return true; }
    spawnSync("sleep", ["3"]);
  }
  fs.rmSync(destino, { force: true });
  return false;
}

async function subirPost(post) {
  const ficha = JSON.parse(fs.readFileSync(caminhoFicha(RAIZ, post.id), "utf8"));
  const erros = validar(ficha, { paraPublicar: true });
  if (erros.length) throw new Error(`#${post.n} ${post.id}: ${erros.join("; ")}`);
  const jpgs = await renderizar(path.join(SAIDA, String(post.n).padStart(2, "0")), ficha);
  const urls = [];
  for (const [i, jpg] of jpgs.entries()) {
    const corpo = fs.readFileSync(jpg);
    const chave = chaveDoSlide(post.n, i, corpo);
    wranglerPut(jpg, chave);
    const url = `${BASE_PUBLICA}/${chave}`;
    if (!conferePublico(url, corpo)) throw new Error(`#${post.n}: link público não confere com o arquivo (${url})`);
    urls.push(url);
  }
  return urls;
}

async function main() {
  const a = process.argv.slice(2);
  const iRef = a.indexOf("--refazer");
  const refazer = iRef >= 0 ? Number(a[iRef + 1]) : null;
  const agenda = JSON.parse(fs.readFileSync(path.join(RAIZ, ARQ_AGENDA), "utf8"));
  const arq = caminhoFila(RAIZ);
  const fila = montarFila(agenda, await lerEstado(arq, { posts: [] }, { valida: validaFila }));
  await gravarEstado(arq, fila);
  if (a.includes("--so-fila")) { console.log(`[subir] fila com ${fila.posts.length} posts: ${arq}`); return; }
  fs.mkdirSync(SAIDA, { recursive: true });
  const alvos = fila.posts.filter((p) => p.canal === "api" && !p.postedAt && (refazer ? p.n === refazer : !p.urls?.length));
  const falhas = [];
  for (const p of alvos) {
    try {
      p.urls = await subirPost(p);
      await gravarEstado(arq, fila); // grava a cada post: uma falha no meio não perde os anteriores
      console.log(`[subir] #${p.n} ${p.id}: 4 slides no R2`);
    } catch (e) { falhas.push(e.message); console.warn(`[subir] ${e.message}`); }
  }
  console.log(`[subir] ${alvos.length - falhas.length}/${alvos.length} ok. Slides locais em ${SAIDA}`);
  if (falhas.length) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(`[subir] FALHA: ${e.stack || e.message}`); process.exit(1); });
