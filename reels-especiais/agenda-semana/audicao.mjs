// Audição de pronúncia da narração do reel da agenda: grava cada frase em variações (grafia e idioma forçado ou não),
// passa no Whisper (whisper-cli, modelo small do hyperframes) e monta uma página com player + o que o Whisper ouviu.
// Uso: node reels-especiais/agenda-semana/audicao.mjs  ->  audicao/index.html
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { sintetizar, vozDaSemana } from "../../scripts/publish/narracao/elevenlabs.mjs";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "audicao", process.argv[2] || "osasco");
fs.mkdirSync(dir, { recursive: true });
const MODELO = "/Users/andrehz/.cache/hyperframes/whisper/models/ggml-small.bin";
const voz = vozDaSemana("2026-W48"), chave = fs.readFileSync("/Users/andrehz/.elevenlabs-key", "utf8").trim();

const GRUPO = process.argv[2] || "osasco";
const TESTES_TODOS = {
  osasco: { "Osasco (rodada 2)": ["Na sexta, Ozasco, Lost Dogs.", "Na sexta, Ôzasco, Lost Dogs.", "Na sexta, Ozásco, Lost Dogs.",
    "Na sexta, O-zás-co, Lost Dogs.", "Na sexta, a cidade de Osasco, Lost Dogs.", "Na sexta, Osasco, em São Paulo, Lost Dogs."] },
};
const TESTES = TESTES_TODOS[GRUPO];
const whisper = (mp3) => {
  const wav = mp3.replace(/\.mp3$/, ".wav");
  spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", mp3, "-ar", "16000", "-ac", "1", wav]);
  const r = spawnSync("whisper-cli", ["-m", MODELO, "-l", "pt", "-nt", "-np", "-f", wav]).stdout.toString().replace(/\s+/g, " ").trim();
  fs.rmSync(wav, { force: true });
  return r;
};
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
let html = `<!doctype html><meta charset="utf-8"><title>Audição da narração</title><style>body{font:16px system-ui;max-width:900px;margin:24px auto;padding:0 16px;background:#14110F;color:#fff}
h2{color:#FFCC1A;margin-top:32px}.t{display:grid;grid-template-columns:44px 1fr;gap:4px 12px;padding:10px;border-bottom:1px solid #333}.n{font:700 22px system-ui;color:#FFCC1A}
small{color:#aaa}audio{width:100%}</style><h1>Audição: narração do reel da agenda (voz ${voz.nome})</h1><p>Ouça e diga o número das que ficaram certas. "PT" = idioma forçado em português; "auto" = a voz detecta sozinha.</p>`;
let n = 0;
for (const [grupo, textos] of Object.entries(TESTES)) {
  html += `<h2>${esc(grupo)}</h2>`;
  for (const texto of textos) for (const idioma of ["pt", null]) {
    n++;
    const arq = path.join(dir, `${String(n).padStart(2, "0")}-${crypto.createHash("sha1").update(`${voz.id}|${idioma}|${texto}`).digest("hex").slice(0, 8)}.mp3`);
    if (!fs.existsSync(arq)) await sintetizar(texto, { vozId: voz.id, apiKey: chave, destino: arq, idioma });
    const ouviu = whisper(arq);
    console.log(`${n} [${idioma || "auto"}] ${texto}  ->  ${ouviu}`);
    html += `<div class="t"><div class="n">${n}</div><div><b>${esc(texto)}</b> <small>(${idioma ? "PT" : "auto"})</small><br><small>Whisper ouviu: ${esc(ouviu)}</small><audio controls src="${path.basename(arq)}"></audio></div></div>`;
  }
}
fs.writeFileSync(path.join(dir, "index.html"), html);
console.log(path.join(dir, "index.html"));
