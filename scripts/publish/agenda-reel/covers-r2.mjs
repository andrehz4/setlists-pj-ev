// Acervo de vídeo das COVERS (fundo das cenas dos dias do reel da agenda) no R2, pasta acervo/covers/<conta>/.
// No git fica só o clips.json de cada banda (media/reels-clips/covers/<conta>/clips.json); os MP4 ficam no R2 e
// na pasta local do Mac (ignorada pelo git). Sobe só os trechos listados no clips.json (os aprovados), nunca o bruto.
//   node scripts/publish/agenda-reel/covers-r2.mjs subir     (Mac; precisa `npx wrangler login` uma vez)
//   node scripts/publish/agenda-reel/covers-r2.mjs conferir  (lista o que está no json e não responde no R2)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { naRaiz } from "../../config.mjs";
import { BUCKET, BASE_PUBLICA } from "../reel/acervo-r2.mjs";

export const PASTA = naRaiz("media/reels-clips/covers");
const CACHE = path.join(os.tmpdir(), "smufdpj-covers");
const chaveR2 = (conta, file) => `acervo/covers/${conta}/${file}`;
export const urlDaCover = (conta, file) => `${BASE_PUBLICA}/acervo/covers/${encodeURIComponent(conta)}/${encodeURIComponent(file)}`;
const semCache = (url) => `${url}?v=${Date.now()}`;
const responde = (url) => spawnSync("curl", ["-sfI", "--max-time", "20", semCache(url)]).status === 0;

// Trechos aprovados de uma banda (lista do clips.json, com o caminho local esperado). Sem json = lista vazia.
export function trechosAprovados(conta, pasta = PASTA) {
  const f = path.join(pasta, conta, "clips.json");
  if (!fs.existsSync(f)) return [];
  return JSON.parse(fs.readFileSync(f, "utf8")).clips.map((c) => ({ ...c, conta, local: path.join(pasta, conta, c.file) }));
}

export function contasComAcervo(pasta = PASTA) {
  return fs.readdirSync(pasta).filter((c) => !c.startsWith("_") && fs.existsSync(path.join(pasta, c, "clips.json")));
}

// Caminho local do trecho: o da pasta do Mac se existir, senão baixa do R2 pro cache. null = não conseguiu.
export function arquivoDa(trecho, { baixar = baixarCurl } = {}) {
  if (trecho.local && fs.existsSync(trecho.local)) return trecho.local;
  const destino = path.join(CACHE, trecho.conta, trecho.file);
  if (fs.existsSync(destino)) return destino;
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  if (baixar(urlDaCover(trecho.conta, trecho.file), destino)) return destino;
  console.warn(`[covers] não baixou ${trecho.conta}/${trecho.file}`);
  return null;
}

function baixarCurl(url, destino) {
  const r = spawnSync("curl", ["-sfL", "--max-time", "60", "-o", destino, semCache(url)]);
  if (r.status !== 0) { fs.rmSync(destino, { force: true }); return false; }
  return true;
}

const todos = () => contasComAcervo().flatMap((c) => trechosAprovados(c));

function subir() {
  let novos = 0, falhas = 0;
  for (const t of todos()) {
    if (!fs.existsSync(t.local) || responde(urlDaCover(t.conta, t.file))) continue;
    const r = spawnSync("npx", ["--yes", "wrangler@latest", "r2", "object", "put", `${BUCKET}/${chaveR2(t.conta, t.file)}`,
      "--file", t.local, "--content-type", "video/mp4", "--remote"], { encoding: "utf8" });
    if (r.status === 0) { novos++; console.log(`[covers] subiu ${t.conta}/${t.file}`); }
    else { falhas++; console.warn(`[covers] falhou ${t.conta}/${t.file}: ${(r.stderr || "").slice(-200)}`); }
  }
  console.log(`[covers] ${novos} enviado(s), ${falhas} falha(s)`);
  return falhas;
}

function conferir() {
  const lista = todos(), faltam = lista.filter((t) => !responde(urlDaCover(t.conta, t.file)));
  console.log(faltam.length ? `[covers] faltam no R2 (${faltam.length}): ${faltam.map((t) => `${t.conta}/${t.file}`).join(", ")}`
    : `[covers] todos os ${lista.length} trechos respondem no R2`);
  return faltam.length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cmd = process.argv[2];
  if (cmd === "subir") process.exit(subir() ? 1 : 0);
  else if (cmd === "conferir") process.exit(conferir() ? 1 : 0);
  else { console.error("uso: covers-r2.mjs subir|conferir"); process.exit(1); }
}
