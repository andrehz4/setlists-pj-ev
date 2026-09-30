// Traz pro projeto os cortes prontos do baixa-clipehz (transições e capas de reel).
// Lá o corte já sai exato, mudo, até 1080p e 30 fps: aqui só copia o MP4 e junta os
// campos no media/reels-clips/transicoes/transicoes.json (sem duplicar pelo nome).
//   node scripts/publish/reel/trazer-do-baixa.mjs            (mostra o que entraria)
//   node scripts/publish/reel/trazer-do-baixa.mjs --aplicar  (copia e grava)
import fs from "node:fs";
import path from "node:path";
import { PASTA } from "./transicoes.mjs";

export const ORIGEM = "/Users/andrehz/Documents/Githubhz/baixa-clipehz/downloads/transicoes";
const CAMPOS = ["musica", "origem", "url", "ini", "fim", "dur", "tags", "nota", "motivo", "foco", "capa"];

// Entradas do baixa que ainda não estão aqui, já no formato do nosso json.
export function novos(daLa, daqui) {
  const tem = new Set(daqui.map((t) => t.file));
  return daLa.filter((t) => t.file && !tem.has(t.file)).map((t) => {
    const e = { file: path.basename(t.file) };
    for (const c of CAMPOS) if (t[c] !== undefined && t[c] !== "") e[c] = t[c];
    if (!Array.isArray(e.tags)) e.tags = typeof e.tags === "string" ? e.tags.split(",").map((x) => x.trim()).filter(Boolean) : [];
    return e;
  });
}

function main() {
  const aplicar = process.argv.includes("--aplicar");
  const la = JSON.parse(fs.readFileSync(path.join(ORIGEM, "transicoes.json"), "utf8")).transicoes || [];
  const arqAqui = path.join(PASTA, "transicoes.json");
  const aqui = JSON.parse(fs.readFileSync(arqAqui, "utf8"));
  const lista = novos(la, aqui.transicoes).filter((e) => fs.existsSync(path.join(ORIGEM, e.file)));
  if (!lista.length) { console.log("[baixa] nada novo pra trazer"); return; }
  for (const e of lista) console.log(`[baixa] ${e.file}${e.capa != null ? ` (capa em ${e.capa}s)` : ""}${e.foco != null ? ` foco ${e.foco}` : ""}`);
  if (!aplicar) { console.log(`[baixa] ${lista.length} novo(s). Rode com --aplicar pra copiar.`); return; }
  for (const e of lista) fs.copyFileSync(path.join(ORIGEM, e.file), path.join(PASTA, e.file));
  aqui.transicoes.push(...lista);
  fs.writeFileSync(arqAqui, JSON.stringify(aqui, null, 2) + "\n");
  console.log(`[baixa] ${lista.length} trazido(s) pra ${PASTA}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
