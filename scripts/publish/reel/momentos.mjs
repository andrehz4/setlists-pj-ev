// "Melhores momentos": acha trechos de 1,5 a 2,5 s com muito movimento num clipe,
// sem atravessar corte de cena, e gera folhas de quadros (horizontal e já no corte
// vertical 9:16) pra IA/Andre escolherem as transições do reel. Não corta nada.
//   node scripts/publish/reel/momentos.mjs <video> [--n 24]
// Saída: .momentos/<nome-do-video>/ (gitignored): candidatos.json, folha-1.jpg, folha-2.jpg, vertical.jpg
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

const ff = (args) => spawnSync("ffmpeg", ["-v", "error", "-nostdin", ...args], { encoding: "utf8", maxBuffer: 1 << 28 });

// Movimento médio por instante (diferença entre quadros, 10 fps) e tempos de corte de cena.
export function lerMovimento(txt) {
  const mov = []; let t = null;
  for (const l of txt.split("\n")) {
    const m = l.match(/pts_time:([\d.]+)/); if (m) t = +m[1];
    const y = l.match(/YAVG=([\d.]+)/); if (y && t != null) mov.push([t, +y[1]]);
  }
  return mov;
}

// Janelas com mais movimento, sem atravessar corte, espaçadas 2 s, fora dos 5 s de início e fim.
export function escolherCandidatos(mov, cortes, n = 24) {
  const dur = mov.at(-1)?.[0] ?? 0;
  const media = (a, b) => { const v = mov.filter(([x]) => x >= a && x < b).map(([, y]) => y); return v.reduce((s, y) => s + y, 0) / (v.length || 1); };
  const todos = [];
  for (let ini = 5; ini + 1.5 <= dur - 5; ini += 0.5) {
    for (const len of [1.5, 2.5]) {
      const fim = ini + len;
      if (cortes.some((c) => c > ini + 0.15 && c < fim - 0.15)) continue;
      todos.push({ ini, fim, mov: Math.round(media(ini, fim) * 10) / 10 });
    }
  }
  todos.sort((a, b) => b.mov - a.mov);
  const esc = [];
  for (const c of todos) { if (esc.every((e) => c.fim < e.ini - 2 || c.ini > e.fim + 2)) esc.push(c); if (esc.length === n) break; }
  return esc.sort((a, b) => a.ini - b.ini).map((c, i) => ({ n: i + 1, ...c }));
}

export const pastaDo = (video) => path.resolve(".momentos", path.basename(video, path.extname(video)).toLowerCase()
  .normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60));

// Movimento (10 fps) e cortes de cena do vídeo inteiro; guarda em .momentos/<nome>/.
export function analisarMovimento(video) {
  const out = pastaDo(video);
  fs.mkdirSync(out, { recursive: true });
  ff(["-i", video, "-an", "-vf", `scale=160:-2,fps=10,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=${path.join(out, "mov.txt")}`, "-f", "null", "-"]);
  const sc = spawnSync("ffmpeg", ["-nostdin", "-i", video, "-an", "-vf", "scale=320:-2,select='gt(scene,0.3)',showinfo", "-f", "null", "-"], { encoding: "utf8", maxBuffer: 1 << 28 });
  const cortes = [...sc.stderr.matchAll(/pts_time:([\d.]+)/g)].map((m) => +m[1]);
  return { out, mov: lerMovimento(fs.readFileSync(path.join(out, "mov.txt"), "utf8")), cortes };
}

export async function folha(tiras, saida) {
  const ms = await Promise.all(tiras.map((t) => sharp(t.arq).metadata()));
  const W = Math.max(...ms.map((m) => m.width)) + 70, H = ms.reduce((s, m) => s + m.height + 6, 0);
  let y = 0; const comp = [];
  tiras.forEach((t, k) => {
    const h = ms[k].height;
    comp.push({ input: t.arq, top: y, left: 70 });
    comp.push({ input: Buffer.from(`<svg width="70" height="${h}"><text x="35" y="${h / 2 + 14}" font-size="40" font-family="Helvetica" font-weight="bold" fill="#ffd400" text-anchor="middle">${t.n}</text></svg>`), top: y, left: 0 });
    y += h + 6;
  });
  await sharp({ create: { width: W, height: H, channels: 3, background: "#111" } }).composite(comp).jpeg({ quality: 82 }).toFile(saida);
}

async function main() {
  const [video, , nArg] = process.argv.slice(2);
  if (!video || !fs.existsSync(video)) { console.error("uso: momentos.mjs <video> [--n 24]"); process.exit(1); }
  const { out, mov, cortes } = analisarMovimento(video);
  fs.mkdirSync(path.join(out, "tiras"), { recursive: true });
  const cands = escolherCandidatos(mov, cortes, Number(nArg) || 24);
  const horiz = [], vert = [];
  for (const c of cands) {
    const len = c.fim - c.ini, h = path.join(out, "tiras", `h${c.n}.jpg`), v = path.join(out, "tiras", `v${c.n}.jpg`);
    ff(["-ss", String(c.ini), "-i", video, "-t", String(len), "-vf", `fps=4/${len},scale=300:-2,tile=4x1:padding=4`, "-frames:v", "1", "-y", h]);
    ff(["-ss", String(c.ini), "-i", video, "-t", String(len), "-vf", `crop=ih*9/16:ih,fps=4/${len},scale=180:-2,tile=4x1:padding=4`, "-frames:v", "1", "-y", v]);
    horiz.push({ n: c.n, arq: h }); vert.push({ n: c.n, arq: v });
  }
  const meio = Math.ceil(horiz.length / 2);
  await folha(horiz.slice(0, meio), path.join(out, "folha-1.jpg"));
  if (horiz.length > meio) await folha(horiz.slice(meio), path.join(out, "folha-2.jpg"));
  await folha(vert, path.join(out, "vertical.jpg"));
  fs.writeFileSync(path.join(out, "candidatos.json"), JSON.stringify({ video: path.resolve(video), cortes: cortes.length, candidatos: cands }, null, 2));
  console.log(`[momentos] ${cands.length} candidatos, ${cortes.length} cortes de cena -> ${out}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
