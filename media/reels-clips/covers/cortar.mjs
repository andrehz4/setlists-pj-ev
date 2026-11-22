// uso: node cortar.mjs <lista.json>  lista: [{conta, id, t, slug, foco?(numero p/ centro manual), quem, plano, acao, clima, descricao, nota}]
import fs from "node:fs"; import path from "node:path"; import { spawnSync } from "node:child_process";
const R = "/Users/andrehz/Documents/Githubhz/setlists-pj-ev";
const { detectar, trilhaSuave, MIN_COBERTURA } = await import(R + "/scripts/publish/reel/rosto/rosto.mjs");
const { recorte } = await import(R + "/scripts/publish/reel/transicoes.mjs");
const TMP = path.join(path.dirname(new URL(import.meta.url).pathname), "../tmp"); fs.mkdirSync(TMP, { recursive: true });
const run = (c, a) => { const r = spawnSync(c, a, { encoding: "utf8", maxBuffer: 1 << 26 }); if (r.status) throw new Error(c + ": " + r.stderr.slice(-400)); return r; };
function cortes(src, a, b) {
  const r = spawnSync("ffmpeg", ["-ss", String(a), "-t", String(b - a), "-i", src, "-vf", "select='gt(scene,0.15)',showinfo", "-an", "-f", "null", "-"], { encoding: "utf8" });
  return [...r.stderr.matchAll(/pts_time:([\d.]+)/g)].map((m) => a + Number(m[1]));
}
const lista = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
for (const c of lista) {
  const src = `${R}/media/reels-clips/covers/_brutos/${c.conta}/${c.id}.mp4`;
  const cs = cortes(src, Math.max(0, c.t - 5), c.t + 5);
  let a = Math.max(0, c.t - 5), b = c.t + 5;
  for (const x of cs) { if (x <= c.t + 0.3) a = Math.max(a, x + 0.1); else b = Math.min(b, x - 0.1); }
  let dur = Math.min(c.dur || 4, b - a);
  if (dur < 2) { console.log(`PULEI ${c.slug}: plano curto (${dur.toFixed(1)}s)`); continue; }
  let ini = Math.max(a, Math.min(c.t - dur / 2, b - dur)); ini = Math.round(ini * 10) / 10; dur = Math.round(dur * 10) / 10;
  const bruto = path.join(TMP, `${c.slug}.mp4`);
  run("ffmpeg", ["-v", "error", "-y", "-ss", String(ini), "-t", String(dur), "-i", src, "-an", "-c:v", "libx264", "-crf", "14", "-preset", "veryfast", bruto]);
  const [w, h] = run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", bruto]).stdout.trim().split(",").map(Number);
  let trilha = null, cob = 0;
  if (w / h > 9 / 16 + 0.01 && c.foco === undefined) {
    const pts = detectar(bruto); cob = pts.filter((p) => Number.isFinite(p.x)).length / pts.length;
    const t = trilhaSuave(pts, { larguraCorte: (h * 9 / 16) / w });
    if (t && cob >= MIN_COBERTURA) trilha = t;
  }
  const foco = trilha ? "rosto" : "centro";
  const vf = (w / h > 9 / 16 + 0.01 ? recorte(trilha ? { focoTrilha: trilha } : { foco: c.foco ?? 0.5 }) + "," : "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,") + "scale=1080:1920:flags=lanczos,fps=30,setsar=1" + (c.eq ? "," + c.eq : "");
  const pasta = `${R}/media/reels-clips/covers/${c.conta}`; fs.mkdirSync(pasta, { recursive: true });
  const file = `${c.conta}-${c.slug}.mp4`, out = path.join(pasta, file);
  run("ffmpeg", ["-v", "error", "-y", "-i", bruto, "-vf", vf, "-an", "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]);
  run("ffmpeg", ["-v", "error", "-y", "-ss", String(dur / 2), "-i", out, "-frames:v", "1", "-q:v", "3", out.replace(/\.mp4$/, ".jpg")]);
  const man = path.join(pasta, "clips.json");
  const doc = fs.existsSync(man) ? JSON.parse(fs.readFileSync(man, "utf8")) : { banda: c.conta, clips: [] };
  doc.clips = doc.clips.filter((k) => k.file !== file);
  doc.clips.push({ file, origem: c.origem || `https://www.youtube.com/watch?v=${c.id}`, ini, fim: Math.round((ini + dur) * 10) / 10, dur, foco, ...(trilha ? { focoTrilha: trilha } : c.foco !== undefined ? { focoX: c.foco } : {}),
    tags: [`banda:${c.conta}`, ...c.quem, c.plano, c.clima, ...c.acao], broll: { quem: c.quem, plano: c.plano, acao: c.acao, clima: c.clima, descricao: c.descricao }, nota: c.nota });
  fs.writeFileSync(man, JSON.stringify(doc, null, 2) + "\n");
  console.log(`OK ${file} ini=${ini} dur=${dur} foco=${foco} cob=${cob.toFixed(2)} cortesPerto=${cs.map((x) => x.toFixed(1)).join(",")}`);
}
