// uso: node cortar.mjs spec.json [slug...]  -> corta, rastreia rosto, recorta 9:16 e grava clips.json
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const R = "/Users/andrehz/Documents/Githubhz/setlists-pj-ev";
const { detectar, trilhaSuave, MIN_COBERTURA } = await import(`${R}/scripts/publish/reel/rosto/rosto.mjs`);
const { recorte } = await import(`${R}/scripts/publish/reel/transicoes.mjs`);
const spec = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const so = process.argv.slice(3);
const TMP = path.join(path.dirname(process.argv[2]), "tmp"); fs.mkdirSync(TMP, { recursive: true });
const ff = (a) => { const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...a], { encoding: "utf8" }); if (r.status) throw new Error(r.stderr); };
const pasta = path.join(R, "media/reels-clips/covers", spec.banda); fs.mkdirSync(pasta, { recursive: true });
const arqJson = path.join(pasta, "clips.json");
const antigo = fs.existsSync(arqJson) ? JSON.parse(fs.readFileSync(arqJson, "utf8")).clips : [];
const clips = [];
let n = 0;
for (const c of spec.clips) {
  n++;
  const file = `${spec.banda}-${c.slug}-${n}.mp4`;
  if (so.length && !so.includes(c.slug + "-" + n)) { const v = antigo.find((x) => x.file === file); if (v) clips.push(v); continue; }
  const dur = Math.round((c.fim - c.ini) * 100) / 100;
  const bruto = path.join(R, "media/reels-clips/covers/_brutos", spec.banda, c.bruto);
  const tr = path.join(TMP, file);
  ff(["-ss", String(c.ini), "-i", bruto, "-t", String(dur), "-an", "-c:v", "libx264", "-crf", "12", "-preset", "veryfast", tr]);
  let trecho = { foco: c.foco ?? 0.5 }, foco = "centro", focoTrilha;
  if (c.rosto !== false) {
    const pts = detectar(tr);
    const cob = pts.filter((p) => Number.isFinite(p.x)).length / pts.length;
    const [w, h] = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", tr], { encoding: "utf8" }).stdout.trim().split(",").map(Number);
    const tri = trilhaSuave(pts, { larguraCorte: (h * 9 / 16) / w });
    if (tri && cob >= MIN_COBERTURA) { focoTrilha = tri; foco = "rosto"; trecho = { focoTrilha: tri }; }
    console.log(`${file}: rosto ${Math.round(cob * 100)}%${focoTrilha ? ` foco ${tri[0].foco}->${tri.at(-1).foco}` : ` (centro ${trecho.foco})`}`);
  } else console.log(`${file}: centro ${trecho.foco}`);
  const out = path.join(pasta, file);
  const [w0, h0] = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", tr], { encoding: "utf8" }).stdout.trim().split(",").map(Number);
  const crop = w0 / h0 <= 9 / 16 + 0.01 ? "crop=iw:iw*16/9" : recorte(trecho);
  ff(["-i", tr, "-vf", `${c.pre ? c.pre + "," : ""}${crop},scale=1080:1920:flags=lanczos,fps=30,format=yuv420p${c.eq ? "," + c.eq : ""}`, "-an", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-movflags", "+faststart", out]);
  ff(["-ss", String(dur / 2), "-i", out, "-frames:v", "1", "-q:v", "3", out.replace(/\.mp4$/, ".jpg")]);
  const { slug, bruto: _b, eq: _e, pre: _p, rosto: _r, foco: _f, origem, nota, broll, tags = [], ...resto } = c;
  clips.push({ file, origem, ini: c.ini, fim: c.fim, dur, foco, ...(focoTrilha ? { focoTrilha } : { focoX: trecho.foco }), tags: [`banda:${spec.banda}`, ...tags], broll, nota });
}
fs.writeFileSync(arqJson, JSON.stringify({ banda: spec.banda, clips }, null, 2) + "\n");
// mosaico de conferência
const jpgs = clips.map((c) => path.join(pasta, c.file.replace(/\.mp4$/, ".jpg")));
const cols = Math.min(5, jpgs.length), rows = Math.ceil(jpgs.length / cols);
ff([...jpgs.flatMap((j) => ["-i", j]), "-filter_complex", `${jpgs.map((_, i) => `[${i}:v]scale=270:480[v${i}]`).join(";")};${jpgs.map((_, i) => `[v${i}]`).join("")}xstack=inputs=${jpgs.length}:layout=${jpgs.map((_, i) => `${(i % cols) * 270}_${Math.floor(i / cols) * 480}`).join("|")}:fill=black`, "-frames:v", "1", path.join(pasta, `_mosaico-${spec.banda}.jpg`)]);
console.log("ok", clips.length);
