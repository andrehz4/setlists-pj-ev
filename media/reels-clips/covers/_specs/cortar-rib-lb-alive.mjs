// Corta trechos 9:16 mudos a partir de uma lista JSON. Uso: node cortar.mjs lista.json [so=nome1,nome2]
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
const RAIZ = "/Users/andrehz/Documents/Githubhz/setlists-pj-ev";
const { detectar, trilhaSuave, MIN_COBERTURA } = await import(`${RAIZ}/scripts/publish/reel/rosto/rosto.mjs`);
const { recorte } = await import(`${RAIZ}/scripts/publish/reel/transicoes.mjs`);

const lista = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const so = (process.argv[3] || "").replace(/^so=/, "").split(",").filter(Boolean);
const ff = (args) => { const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...args], { encoding: "utf8" }); if (r.status) throw new Error(r.stderr); };
const TMP = path.join(path.dirname(process.argv[2]), "tmp");
fs.mkdirSync(TMP, { recursive: true });

for (const banda of lista) {
  const dir = path.join(RAIZ, "media/reels-clips/covers", banda.banda);
  fs.mkdirSync(dir, { recursive: true });
  const man = path.join(dir, "clips.json");
  const doc = fs.existsSync(man) ? JSON.parse(fs.readFileSync(man, "utf8")) : { banda: banda.banda, clips: [] };
  for (const c of banda.clips) {
    const file = `${banda.banda}-${c.slug}.mp4`;
    if (so.length && !so.includes(c.slug)) continue;
    const src = path.join(RAIZ, "media/reels-clips/covers/_brutos", banda.banda, c.src + ".mp4");
    const tmp = path.join(TMP, file);
    ff(["-ss", String(c.ini), "-t", String(c.dur), "-i", src, "-an", "-c:v", "libx264", "-crf", "10", "-preset", "veryfast", tmp]);
    let trilha = null, cob = 0;
    if (c.rosto !== false) {
      const pts = detectar(tmp);
      cob = pts.filter((p) => Number.isFinite(p.x)).length / pts.length;
      const [w, h] = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", tmp], { encoding: "utf8" }).stdout.trim().split(",").map(Number);
      if (cob >= MIN_COBERTURA) trilha = trilhaSuave(pts, { larguraCorte: (h * 9 / 16) / w });
    }
    const crop = trilha ? recorte({ focoTrilha: trilha }) : recorte({ foco: c.foco ?? 0.5 });
    const pre = c.pre ? `${c.pre},` : "";
    ff(["-i", tmp, "-vf", `${pre}${crop},scale=1080:1920:flags=lanczos,fps=30,format=yuv420p`, "-an", "-c:v", "libx264", "-crf", "19", "-preset", "medium", "-movflags", "+faststart", path.join(dir, file)]);
    ff(["-ss", String(c.dur / 2), "-i", path.join(dir, file), "-frames:v", "1", "-q:v", "3", path.join(dir, file.replace(/\.mp4$/, ".jpg"))]);
    fs.rmSync(tmp);
    const item = {
      file, origem: banda.origens[c.src], ini: c.ini, fim: Math.round((c.ini + c.dur) * 100) / 100, dur: c.dur,
      foco: trilha ? "rosto" : "centro", ...(trilha ? { focoTrilha: trilha } : { focoX: c.foco ?? 0.5 }),
      tags: [`banda:${banda.banda}`, ...(c.tags || [])], broll: c.broll, nota: c.nota,
    };
    doc.clips = doc.clips.filter((k) => k.file !== file).concat(item).sort((a, b) => a.file.localeCompare(b.file));
    console.log(`${file}: cobertura rosto ${Math.round(cob * 100)}% -> ${item.foco}${trilha ? ` ${trilha[0].foco}->${trilha.at(-1).foco}` : ` x=${c.foco ?? 0.5}`}`);
  }
  fs.writeFileSync(man, JSON.stringify(doc, null, 2) + "\n");
}
