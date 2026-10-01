// Acervo "plano a plano" (o jeito mais completo): lista CADA plano de câmera do clipe que
// dure 1 s ou mais (entre dois cortes de cena), fora os já usados, e gera grades verticais
// numeradas pro Claude escolher olhando. Depois importa os escolhidos com nome, mudo, e com
// o recorte seguindo o rosto quando há rosto na maior parte dos quadros.
//   node scripts/publish/reel/planos.mjs <video>                                  (grades em .momentos/<nome>/planos-N.jpg)
//   node scripts/publish/reel/planos.mjs <video> --importar p3:silhueta-fogo,p7:eddie-mic --musica "Sirens"
// Depois: preencher o "broll" de cada trecho no transicoes.json (ver README do acervo).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
import { analisarMovimento, pastaDo } from "./momentos.mjs";
import { detectar, trilhaSuave, MIN_COBERTURA } from "./rosto/rosto.mjs";
import { subir } from "./acervo-r2.mjs";

const ARQ_JSON = path.resolve("media/reels-clips/transicoes/transicoes.json");
const POR_FOLHA = 60;

// Planos entre cortes com pelo menos `min` s: o miolo (até 1,5 s), ou um trecho a cada 4 s se o plano
// passar de 6 s; fora do que já está no acervo.
export function listarPlanos(cortes, fimVideo, usados = [], min = 0.95) {
  const bordas = [0, ...[...cortes].sort((a, b) => a - b), fimVideo], out = [];
  for (let i = 0; i < bordas.length - 1; i++) {
    const a = bordas[i] + 0.08, b = bordas[i + 1] - 0.08;
    if (b - a < min) continue;
    // plano longo (câmera passeando, como no Unplugged): um trecho a cada 4 s; curto: o miolo
    const inis = b - a > 6 ? Array.from({ length: Math.floor((b - a - 1.5) / 4) + 1 }, (_, k) => a + 0.5 + k * 4).filter((x) => x + 1.5 <= b)
      : [a + (b - a - Math.min(1.5, b - a)) / 2];
    for (const x of inis) {
      const ini = +x.toFixed(2), fim = +(x + Math.min(1.5, b - a)).toFixed(2);
      if (usados.some(([u, v]) => ini < v && fim > u)) continue;
      out.push({ id: `p${out.length + 1}`, ini, fim });
    }
  }
  return out;
}

const usadosDo = (video) => JSON.parse(fs.readFileSync(ARQ_JSON, "utf8")).transicoes
  .filter((t) => t.origem === path.basename(video) && Number.isFinite(t.ini)).map((t) => [t.ini, t.fim ?? t.ini + 1.5]);

async function grades(video, planos, out) {
  fs.mkdirSync(path.join(out, "pq"), { recursive: true });
  const cw = 160, ch = 284, cols = 10;
  for (let f = 0; f * POR_FOLHA < planos.length; f++) {
    const lote = planos.slice(f * POR_FOLHA, (f + 1) * POR_FOLHA), comp = [];
    for (const [i, p] of lote.entries()) {
      const o = path.join(out, "pq", `${p.id}.jpg`);
      spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", String((p.ini + p.fim) / 2), "-i", video, "-frames:v", "1", "-vf", `crop=ih*9/16:ih,scale=${cw}:${ch}`, o]);
      const x = (i % cols) * (cw + 4), y = Math.floor(i / cols) * (ch + 26);
      comp.push({ input: o, left: x, top: y + 24 }, { input: Buffer.from(`<svg width="${cw}" height="24"><text x="3" y="19" font-size="18" font-family="Helvetica" font-weight="bold" fill="#ffd400">${p.id} ${p.ini}s</text></svg>`), left: x, top: y });
    }
    await sharp({ create: { width: cols * (cw + 4), height: Math.ceil(lote.length / cols) * (ch + 26), channels: 3, background: "#111" } })
      .composite(comp).jpeg({ quality: 78 }).toFile(path.join(out, `planos-${f + 1}.jpg`));
  }
}

async function analisar(video) {
  const { out, mov, cortes } = analisarMovimento(video);
  const planos = listarPlanos(cortes, mov.at(-1)?.[0] ?? 0, usadosDo(video));
  fs.writeFileSync(path.join(out, "planos.json"), JSON.stringify(planos, null, 1));
  await grades(video, planos, out);
  console.log(`[planos] ${cortes.length} cortes, ${planos.length} planos de 1 s ou mais -> ${out}/planos-*.jpg`);
}

function importar(video, pares, musica) {
  const planos = JSON.parse(fs.readFileSync(path.join(pastaDo(video), "planos.json"), "utf8"));
  const slug = (musica || "clipe").toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  for (const par of pares) {
    const [id, nomeCurto] = par.split(":");
    const p = planos.find((x) => x.id === id);
    if (!p || !nomeCurto) { console.warn(`[planos] ${par}: plano ou nome inválido`); continue; }
    const nome = `${slug}-${nomeCurto}`;
    const r = spawnSync(process.execPath, [path.resolve("scripts/publish/reel/importar-transicao.mjs"), path.resolve(video), nome, "--musica", musica || "",
      "--ini", String(p.ini), "--fim", String(p.fim)], { encoding: "utf8" });
    process.stdout.write(r.stdout || r.stderr);
    if (r.status !== 0) continue;
    const arq = path.resolve("media/reels-clips/transicoes", `${nome}.mp4`), pts = detectar(arq);
    const cob = pts.filter((q) => Number.isFinite(q.x)).length / (pts.length || 1);
    const doc = JSON.parse(fs.readFileSync(ARQ_JSON, "utf8"));
    const t = doc.transicoes.find((x) => x.file === `${nome}.mp4`);
    const [w, h] = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", arq], { encoding: "utf8" }).stdout.trim().split(",").map(Number);
    const trilha = cob >= MIN_COBERTURA ? trilhaSuave(pts, { larguraCorte: (h * 9 / 16) / w }) : null;
    if (trilha) { t.focoTrilha = trilha; t.rosto = { achou: true, cobertura: +cob.toFixed(2) }; }
    fs.writeFileSync(ARQ_JSON, JSON.stringify(doc, null, 2) + "\n");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = process.argv.slice(2), op = (k) => (a.includes(k) ? a[a.indexOf(k) + 1] : null);
  if (!a[0] || !fs.existsSync(a[0])) { console.error("uso: planos.mjs <video> [--importar p3:nome,p7:nome --musica X]"); process.exit(1); }
  if (op("--importar")) importar(a[0], op("--importar").split(","), op("--musica")), subir(); // sobe pro R2 o que acabou de entrar
  else await analisar(a[0]);
}
