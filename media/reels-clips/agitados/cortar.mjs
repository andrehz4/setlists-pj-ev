// Acervo de AGITADOS (shows antigos com escalada, salto, galera). Corta trechos mudos 9:16 dos brutos,
// com recorte seguindo o rosto quando o rosto aparece na maior parte dos quadros (senão centro ou focoX manual).
// Separado do acervo do reel semanal (transicoes.json): nada aqui entra no reel automático.
//   node media/reels-clips/agitados/cortar.mjs <lista.json>
//   lista: [{ video: "<id do YouTube>", ini, fim, slug, show, descricao, nota, tags: [], focoX?, lento?: [ini, fim] }]
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PASTA = path.dirname(new URL(import.meta.url).pathname);
const R = path.resolve(PASTA, "../../..");
const { detectar, trilhaSuave, MIN_COBERTURA } = await import(R + "/scripts/publish/reel/rosto/rosto.mjs");
const { recorte } = await import(R + "/scripts/publish/reel/transicoes.mjs");
const BRUTOS = path.join(PASTA, "_brutos");
const TMP = path.join(BRUTOS, "_tmp");
const MAN = path.join(PASTA, "clips.json");

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.status) throw new Error(`${cmd}: ${r.stderr.slice(-400)}`);
  return r;
}

function bruto(id) {
  const f = fs.readdirSync(BRUTOS).find((x) => x.startsWith(id + "__") && x.endsWith(".mp4"));
  if (!f) throw new Error(`bruto não achado: ${id}`);
  return path.join(BRUTOS, f);
}

function cortar(c) {
  const dur = Math.round((c.fim - c.ini) * 100) / 100;
  const tmp = path.join(TMP, `${c.slug}.mp4`);
  run("ffmpeg", ["-v", "error", "-y", "-ss", String(c.ini), "-t", String(dur), "-i", bruto(c.video), "-an", "-c:v", "libx264", "-crf", "14", "-preset", "veryfast", tmp]);
  const [w, h] = run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", tmp]).stdout.trim().split(",").map(Number);
  let trilha = null, cob = 0;
  if (c.focoX === undefined) {
    const pts = detectar(tmp);
    cob = pts.filter((p) => Number.isFinite(p.x)).length / Math.max(1, pts.length);
    const t = trilhaSuave(pts, { larguraCorte: (h * 9 / 16) / w });
    if (t && cob >= MIN_COBERTURA) trilha = t;
  }
  const foco = trilha ? "rosto" : c.focoX !== undefined ? "manual" : "centro";
  const vf = recorte(trilha ? { focoTrilha: trilha } : { foco: c.focoX ?? 0.5 }) + ",scale=1080:1920:flags=lanczos,fps=30,setsar=1";
  const file = `${c.slug}.mp4`, out = path.join(PASTA, file);
  run("ffmpeg", ["-v", "error", "-y", "-i", tmp, "-vf", vf, "-an", "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]);
  run("ffmpeg", ["-v", "error", "-y", "-ss", String(dur / 2), "-i", out, "-frames:v", "1", "-q:v", "3", out.replace(/\.mp4$/, ".jpg")]);
  fs.rmSync(tmp, { force: true });
  return {
    file, origem: `https://www.youtube.com/watch?v=${c.video}`, ini: c.ini, fim: c.fim, dur, foco,
    ...(trilha ? { focoTrilha: trilha } : c.focoX !== undefined ? { focoX: c.focoX } : {}),
    ...(c.lento ? { lento: c.lento } : {}),
    show: c.show, descricao: c.descricao, nota: c.nota, tags: c.tags || [], cobertura: +cob.toFixed(2),
  };
}

const lista = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
fs.mkdirSync(TMP, { recursive: true });
const doc = fs.existsSync(MAN) ? JSON.parse(fs.readFileSync(MAN, "utf8")) : { acervo: "agitados", clips: [] };
for (const c of lista) {
  try {
    const k = cortar(c);
    doc.clips = doc.clips.filter((x) => x.file !== k.file).concat(k);
    fs.writeFileSync(MAN, JSON.stringify(doc, null, 1) + "\n");
    console.log(`OK ${k.file} ${k.dur}s foco=${k.foco} cob=${k.cobertura}`);
  } catch (e) {
    console.log(`FALHOU ${c.slug}: ${e.message.split("\n")[0]}`);
  }
}
