// Grade de quadros (um por candidato, já no recorte 9:16) do acervo-auto, pra escolher rápido.
//   node scripts/publish/reel/grade-auto.mjs <pasta .momentos/<nome>>   -> <pasta>/grade-auto.jpg
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
import { recorte } from "./transicoes.mjs";

export async function gradeAuto(pasta) {
  const a = JSON.parse(fs.readFileSync(path.join(pasta, "auto.json"), "utf8"));
  const lista = [...a.c, ...a.t, ...(a.a || [])];
  fs.mkdirSync(path.join(pasta, "q"), { recursive: true });
  const cw = 160, ch = 284, cols = 10, comp = [];
  for (const [i, c] of lista.entries()) {
    const o = path.join(pasta, "q", `${c.id}.jpg`);
    const meio = c.id[0] === "c" ? c.ini + 0.3 : (c.ini + c.fim) / 2;
    spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", String(meio), "-i", a.video, "-frames:v", "1", "-filter_complex",
      `[0:v]${recorte({ focoTrilha: c.cob >= 0.5 ? c.trilha : null })},scale=${cw}:${ch}[v]`, "-map", "[v]", o]);
    const x = (i % cols) * (cw + 4), y = Math.floor(i / cols) * (ch + 26);
    comp.push({ input: o, left: x, top: y + 24 }, { input: Buffer.from(`<svg width="${cw}" height="24"><text x="3" y="19" font-size="18" font-family="Helvetica" font-weight="bold" fill="${c.id[0] === "c" ? "#ff5a5a" : "#ffd400"}">${c.id} ${c.ini}s</text></svg>`), left: x, top: y });
  }
  if (!lista.length) return null;
  const saida = path.join(pasta, "grade-auto.jpg");
  await sharp({ create: { width: cols * (cw + 4), height: Math.ceil(lista.length / cols) * (ch + 26), channels: 3, background: "#111" } })
    .composite(comp).jpeg({ quality: 78 }).toFile(saida);
  return saida;
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(await gradeAuto(path.resolve(process.argv[2])));
