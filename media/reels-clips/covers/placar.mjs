// Placar do acervo de vídeo das covers: por banda, quantos trechos, quantos close com energia, nota média e o que falta.
// Meta por banda: 6 trechos, 3 close com energia (nota 4+). Abaixo disso = DEFICIENTE (o Andre procura na mão e manda).
//   node media/reels-clips/covers/placar.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(DIR, "../../..");
const META = { total: 6, close: 3 };
const doc = JSON.parse(fs.readFileSync(path.join(RAIZ, "media/agenda/bandas.json"), "utf8"));
const bandas = Array.isArray(doc) ? doc : doc.bandas || Object.values(doc);

const linhas = bandas.map((b) => {
  const f = path.join(DIR, b.conta, "clips.json");
  const brutos = fs.existsSync(path.join(DIR, "_brutos", b.conta)) ? fs.readdirSync(path.join(DIR, "_brutos", b.conta)).filter((x) => /\.(mp4|webm|mkv)$/i.test(x)).length : 0;
  if (!fs.existsSync(f)) return { b, total: 0, close: 0, media: 0, brutos, status: brutos ? "EM ANDAMENTO" : "SEM NADA AINDA" };
  const clips = (JSON.parse(fs.readFileSync(f, "utf8")).clips || []).filter((c) => fs.existsSync(path.join(DIR, b.conta, c.file)));
  const close = clips.filter((c) => c.broll?.plano === "close" && (c.nota || 0) >= 4).length;
  const media = clips.length ? clips.reduce((s, c) => s + (c.nota || 0), 0) / clips.length : 0;
  const falta = [];
  if (clips.length < META.total) falta.push(`${META.total - clips.length} trecho(s)`);
  if (close < META.close) falta.push(`${META.close - close} close forte(s)`);
  return { b, total: clips.length, close, media, brutos, status: falta.length ? `DEFICIENTE: falta ${falta.join(" e ")}` : "OK" };
});

console.log(`PLACAR DO ACERVO DAS COVERS (meta: ${META.total} trechos, ${META.close} close forte por banda)\n`);
for (const l of linhas.sort((a, b) => a.total - b.total)) {
  const icone = l.status === "OK" ? "OK " : l.status.startsWith("DEF") ? "!! " : ".. ";
  console.log(`${icone}${l.b.nome.padEnd(26)} @${l.b.conta.padEnd(22)} ${String(l.total).padStart(2)} trechos | ${l.close} close forte | nota ${l.media.toFixed(1)} | ${l.status}`);
}
const def = linhas.filter((l) => l.status !== "OK");
console.log(`\n${linhas.length - def.length} de ${linhas.length} bandas OK.`);
