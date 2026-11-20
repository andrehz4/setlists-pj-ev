// Reel do dia (20/11, Eddie no Ibirapuera): todos os vídeos do Andre em brutos/, em ordem de horário (nome
// AAAAMMDD_HHMMSS), com hora + artista do momento na tela, trilha própria por cima e som ao vivo baixo (direito autoral).
// Uso: node reels-especiais/show-ibirapuera/reel-dia.mjs [--max 45] [--pular arq1,arq2]  ->  saida/reel-dia.mp4
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { trilhaPropria } from "../../scripts/publish/trilha/ligar.mjs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const brutos = path.join(dir, "brutos"), saida = path.join(dir, "saida");
fs.mkdirSync(saida, { recursive: true });
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const MAX = Number(arg("max", "45")), PULAR = new Set(String(arg("pular", "")).split(",").filter(Boolean));
const W = 1080, H = 1920, FINAL = 2.5;
const COR = { fundo: "#140C07", laranja: "#FF7A1A", vermelho: "#E8202A", claro: "#FFFFFF" };
const selo = `data:image/jpeg;base64,${fs.readFileSync(path.join(dir, "..", "story-ao-vivo", "selo-smufdpj.jpg")).toString("base64")}`;

// Grade de sexta (divulgada pelo festival). Antes das 16h = chegada.
export const GRADE = [[0, "A CHEGADA"], [16 * 60, "SAMUEL ROSA"], [17 * 60 + 30, "LINKA MOJA"], [19 * 60, "SIMON TOWNSHEND"], [20 * 60, "EDDIE VEDDER"]];
export const artistaDe = (min) => GRADE.filter(([m]) => min >= m).at(-1)[1];
const duracao = (f) => Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).stdout.toString());

const arquivos = fs.readdirSync(brutos).filter((f) => /^\d{8}_\d{6}\.mp4$/i.test(f) && !PULAR.has(f)).sort();
if (!arquivos.length) throw new Error("brutos/ vazio");
const clipes = arquivos.map((f) => {
  const h = Number(f.slice(9, 11)), m = Number(f.slice(11, 13));
  return { arq: f, hora: `${h}H${String(m).padStart(2, "0")}`, artista: artistaDe(h * 60 + m), dur: duracao(path.join(brutos, f)) };
});
// Orçamento: Eddie ganha o dobro; chegada no máximo 2 trechos. Cada trecho de 2,5 a 5 s, tirado do miolo do vídeo.
const peso = (c) => (c.artista === "EDDIE VEDDER" ? 2 : 1);
let usados = clipes.filter((c, i) => c.artista !== "A CHEGADA" || clipes.slice(0, i).filter((x) => x.artista === "A CHEGADA").length < 2);
const somaPeso = usados.reduce((s, c) => s + peso(c), 0);
const porPeso = (MAX - FINAL) / somaPeso;
usados = usados.map((c) => {
  const d = Math.max(2.5, Math.min(5 * peso(c), porPeso * peso(c), c.dur - 0.4));
  return { ...c, corte: +d.toFixed(2), ini: +Math.max(0, (c.dur - d) / 2).toFixed(2) };
}).filter((c) => c.corte >= 2);
let total = usados.reduce((s, c) => s + c.corte, 0);
while (total + FINAL > 60 && usados.length > 3) { usados.splice(usados.findIndex((c) => c.artista !== "EDDIE VEDDER"), 1); total = usados.reduce((s, c) => s + c.corte, 0); }

const topo = (hora, artista) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".6"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs>
  <rect width="${W}" height="600" fill="url(#g)"/>
  <circle cx="96" cy="190" r="18" fill="${COR.vermelho}"/><text x="128" y="203" font-family="Archivo Black" font-size="36" fill="${COR.claro}">IBIRAPUERA · 20/11</text>
  <clipPath id="cs"><circle cx="964" cy="190" r="54"/></clipPath><image href="${selo}" x="910" y="136" width="108" height="108" clip-path="url(#cs)"/><circle cx="964" cy="190" r="54" fill="none" stroke="${COR.laranja}" stroke-width="5"/>
  <rect x="72" y="290" width="${hora.length * 52 + 44}" height="110" fill="${COR.claro}"/><text x="94" y="380" font-family="Anton" font-size="96" fill="${COR.fundo}">${hora}</text>
  <rect x="72" y="414" width="${artista.length * 58 + 52}" height="128" fill="${artista === "EDDIE VEDDER" ? COR.vermelho : COR.laranja}"/><text x="96" y="514" font-family="Anton" font-size="104" fill="${artista === "EDDIE VEDDER" ? COR.claro : COR.fundo}">${artista}</text></svg>`;
const fim = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="${COR.fundo}"/>
  <text x="72" y="800" font-family="Anton" font-size="190" fill="${COR.claro}">UM DIA</text><text x="72" y="990" font-family="Anton" font-size="190" fill="${COR.claro}">INTEIRO DE</text>
  <text x="72" y="1180" font-family="Anton" font-size="190" fill="${COR.laranja}">EDDIE</text>
  <rect x="0" y="1360" width="${W}" height="150" fill="${COR.laranja}"/><text x="72" y="1460" font-family="Anton" font-size="70" fill="${COR.fundo}">SEGUE A COBERTURA · @SMUFDPJ</text></svg>`;

const args = ["-y", "-hide_banner", "-loglevel", "error"], filtros = [];
for (const [i, c] of usados.entries()) {
  const png = path.join(saida, `reel-topo-${i}.png`);
  await sharp(Buffer.from(topo(c.hora, c.artista))).png().toFile(png);
  args.push("-ss", String(c.ini), "-t", String(c.corte), "-i", path.join(brutos, c.arq), "-i", png);
  filtros.push(`[${i * 2}:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=30,setsar=1[b${i}];[b${i}][${i * 2 + 1}:v]overlay=0:0,format=yuv420p[v${i}]`,
    `[${i * 2}:a]aresample=44100,aformat=channel_layouts=stereo,volume=0.18[a${i}]`);
}
const n = usados.length, fimPng = path.join(saida, "reel-fim.png");
await sharp(Buffer.from(fim)).png().toFile(fimPng);
args.push("-loop", "1", "-t", String(FINAL), "-i", fimPng, "-f", "lavfi", "-t", String(FINAL), "-i", "anullsrc=r=44100:cl=stereo");
filtros.push(`[${n * 2}:v]fps=30,setsar=1,format=yuv420p[v${n}]`, `[${n * 2 + 1}:a]anull[a${n}]`);
const dur = total + FINAL;
const trilha = trilhaPropria({ uso: "reel", semente: "2026-11-20-dia", plano: [{ de: 0, ate: 0.4, nivel: "magro" }, { de: 0.4, ate: dur, nivel: "cheio" }],
  duracao: dur, saida: path.join(saida, "trilha-reel.m4a"), env: { TRILHA_PROPRIA: "1" } });
if (!trilha) throw new Error("trilha própria não montou");
args.push("-i", trilha.path);
filtros.push(`${Array.from({ length: n + 1 }, (_, i) => `[v${i}][a${i}]`).join("")}concat=n=${n + 1}:v=1:a=1[v][amb]`,
  `[${n * 2 + 2}:a]volume=0.6,afade=t=out:st=${(dur - 1.2).toFixed(2)}:d=1.2[m];[amb][m]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5[a]`);
const out = path.join(saida, "reel-dia.mp4");
args.push("-filter_complex", filtros.join(";"), "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
  "-b:v", "8M", "-maxrate", "10M", "-bufsize", "16M", "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-movflags", "+faststart", "-t", String(dur), out);
if (spawnSync("ffmpeg", args, { stdio: "inherit" }).status !== 0) throw new Error("ffmpeg falhou");
console.log(usados.map((c) => `${c.hora} ${c.artista} ${c.arq} ${c.corte}s`).join("\n"));
console.log("reel:", out, `${dur.toFixed(1)} s | trilha:`, trilha.name);
