// Acervo de trechos do reel no R2 (bucket smufdpj-midia, pasta acervo/, SEM a regra de
// apagar em 3 dias, que vale só pra reels/ e stories/). No git fica só o transicoes.json;
// os MP4 ficam no R2 e numa pasta local do Mac (ignorada pelo git).
//   node scripts/publish/reel/acervo-r2.mjs subir     (Mac: sobe o que falta; precisa `npx wrangler login` uma vez)
//   node scripts/publish/reel/acervo-r2.mjs conferir  (lista o que está no json e não responde no R2)
// No GitHub Actions o reel baixa só os trechos sorteados da semana (materializar), pelo link público.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { naRaiz } from "../../config.mjs";

export const BUCKET = "smufdpj-midia";
export const PREFIXO = "acervo";
export const BASE_PUBLICA = (process.env.R2_MIDIA_PUBLIC_BASE || "https://midia.somaisumfadepearljam.com.br").replace(/\/+$/, "");
const CACHE = path.join(os.tmpdir(), "smufdpj-acervo");

export const urlDo = (file) => `${BASE_PUBLICA}/${PREFIXO}/${encodeURIComponent(file)}`;
// a borda da Cloudflare guarda 404 por alguns minutos: download e conferência furam o cache
const semCache = (url) => `${url}?v=${Date.now()}`;

// Garante o MP4 local de cada trecho escolhido: usa o da pasta do acervo se existir, senão
// baixa do R2 pro cache. Trecho que não baixar sai da lista (reel segue sem ele).
export function materializar(trechos, { baixar = baixarCurl } = {}) {
  return trechos.filter((t) => {
    if (t.arq && fs.existsSync(t.arq)) return true;
    fs.mkdirSync(CACHE, { recursive: true });
    const destino = path.join(CACHE, t.file);
    if (!fs.existsSync(destino) && !baixar(urlDo(t.file), destino)) { console.warn(`[acervo] não baixou ${t.file}`); return false; }
    t.arq = destino;
    return true;
  });
}

function baixarCurl(url, destino) {
  const r = spawnSync("curl", ["-sfL", "--max-time", "60", "-o", destino, semCache(url)]);
  if (r.status !== 0) { fs.rmSync(destino, { force: true }); return false; }
  return true;
}

const responde = (url) => spawnSync("curl", ["-sfI", "--max-time", "20", semCache(url)]).status === 0;

function lerAcervo() {
  const pasta = naRaiz("media/reels-clips/transicoes");
  return { pasta, lista: JSON.parse(fs.readFileSync(path.join(pasta, "transicoes.json"), "utf8")).transicoes };
}

export function subir() {
  const { pasta, lista } = lerAcervo();
  let novos = 0, falhas = 0;
  for (const t of lista) {
    const local = path.join(pasta, t.file);
    if (!fs.existsSync(local) || responde(urlDo(t.file))) continue;
    const r = spawnSync("npx", ["--yes", "wrangler@latest", "r2", "object", "put", `${BUCKET}/${PREFIXO}/${t.file}`,
      "--file", local, "--content-type", "video/mp4", "--remote"], { encoding: "utf8" });
    if (r.status === 0) { novos++; console.log(`[acervo] subiu ${t.file}`); } else { falhas++; console.warn(`[acervo] falhou ${t.file}: ${(r.stderr || "").slice(-200)}`); }
  }
  console.log(`[acervo] ${novos} enviado(s), ${falhas} falha(s), ${lista.length} no acervo`);
  return { novos, falhas };
}

function conferir() {
  const { lista } = lerAcervo();
  const faltam = lista.filter((t) => !responde(urlDo(t.file))).map((t) => t.file);
  console.log(faltam.length ? `[acervo] faltam no R2 (${faltam.length}): ${faltam.join(", ")}` : `[acervo] todos os ${lista.length} trechos respondem no R2`);
  if (faltam.length) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cmd = process.argv[2];
  if (cmd === "subir") { if (subir().falhas) process.exit(1); }
  else if (cmd === "conferir") conferir();
  else { console.error("uso: acervo-r2.mjs subir|conferir"); process.exit(1); }
}
