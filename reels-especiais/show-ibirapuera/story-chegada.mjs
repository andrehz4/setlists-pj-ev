// Story "Portões abertos": vídeos do Andre no Ibirapuera (20/11) em sequência, com hora e legenda por trecho,
// som ambiente baixo + cama da trilha própria, cartão final. Vídeos brutos fora do git (brutos/).
// Uso: node reels-especiais/show-ibirapuera/story-chegada.mjs [2]  ->  saida/story-chegada[2].mp4 (2 = segundo show, brutos2/)
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { trilhaPropria } from "../../scripts/publish/trilha/ligar.mjs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const saida = path.join(dir, "saida");
fs.mkdirSync(saida, { recursive: true });
const W = 1080, H = 1920;
const COR = { fundo: "#140C07", laranja: "#FF7A1A", vermelho: "#E8202A", claro: "#FFFFFF" };
const selo = `data:image/jpeg;base64,${fs.readFileSync(path.join(dir, "..", "story-ao-vivo", "selo-smufdpj.jpg")).toString("base64")}`;

const DIA2 = process.argv[2] === "2";
const brutos = path.join(dir, DIA2 ? "brutos2" : "brutos");
const TRECHOS2 = [
  { arq: "20261121_165723.mp4", ini: 1, dur: 4.5, hora: "16H57", txt: "SEGUNDO DIA, BORA" },
  { arq: "20261121_165949.mp4", ini: 0.5, dur: 4, hora: "16H59", txt: "O PARQUE POR DENTRO" },
  { arq: "20261121_171254.mp4", ini: 3, dur: 6, hora: "17H12", txt: "KINGFISH NO PALCO" },
  { arq: "20261121_171406.mp4", ini: 1.5, dur: 4.5, hora: "17H14", txt: "A PISTA ENCHENDO" },
  { arq: "20261121_172936.mp4", ini: 2, dur: 5, hora: "17H29", txt: "BLUES NA GRAMA" },
];
const TRECHOS1 = [
  { arq: "20261120_140047.mp4", ini: 2, dur: 4.5, hora: "14H00", txt: "A FILA DA ENTRADA" },
  { arq: "20261120_142010.mp4", ini: 0, dur: 4.5, hora: "14H20", txt: "PORTÕES ABERTOS" },
  { arq: "20261120_142254.mp4", ini: 0.3, dur: 3.5, hora: "14H22", txt: "PRIMEIRA PARADA: O MERCH" },
  { arq: "20261120_143226.mp4", ini: 2.4, dur: 3.2, hora: "14H32", txt: "RUMO À PISTA" },
  { arq: "20261120_143252.mp4", ini: 0, dur: 3.9, hora: "14H32", txt: "AINDA DÁ PRA ESCOLHER LUGAR" },
  { arq: "20261120_143417.mp4", ini: 3, dur: 6, hora: "14H34", txt: "O PALCO DO EDDIE" },
];
export const TRECHOS = DIA2 ? TRECHOS2 : TRECHOS1;
const FINAL = 2.5;

const topo = (hora, txt) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".65"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs>
  <rect width="${W}" height="620" fill="url(#g)"/>
  <circle cx="96" cy="190" r="18" fill="${COR.vermelho}"/><text x="128" y="203" font-family="Archivo Black" font-size="36" fill="${COR.claro}">AO VIVO DO IBIRAPUERA</text>
  <clipPath id="cs"><circle cx="964" cy="190" r="54"/></clipPath><image href="${selo}" x="910" y="136" width="108" height="108" clip-path="url(#cs)"/><circle cx="964" cy="190" r="54" fill="none" stroke="${COR.laranja}" stroke-width="5"/>
  <rect x="72" y="290" width="${hora.length * 62 + 50}" height="140" fill="${COR.laranja}"/><text x="96" y="400" font-family="Anton" font-size="120" fill="${COR.fundo}">${hora}</text>
  <rect x="72" y="446" width="${txt.length * 30 + 48}" height="78" fill="${COR.claro}"/><text x="96" y="502" font-family="Archivo Black" font-size="44" fill="${COR.fundo}">${txt}</text></svg>`;
const fim = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="${COR.fundo}"/>
  <text x="72" y="820" font-family="Anton" font-size="200" fill="${COR.claro}">FICA</text><text x="72" y="1010" font-family="Anton" font-size="200" fill="${COR.claro}">LIGADO</text>
  <text x="72" y="1200" font-family="Anton" font-size="200" fill="${COR.laranja}">ATÉ O FIM</text>
  <rect x="0" y="1380" width="${W}" height="150" fill="${COR.laranja}"/><text x="72" y="1482" font-family="Anton" font-size="70" fill="${COR.fundo}">COBERTURA AO VIVO · @SMUFDPJ</text></svg>`;

const args = ["-y", "-hide_banner", "-loglevel", "error"];
const filtros = [];
for (const [i, t] of TRECHOS.entries()) {
  const png = path.join(saida, `topo-${DIA2 ? "d2-" : ""}${i}.png`);
  await sharp(Buffer.from(topo(t.hora, t.txt))).png().toFile(png);
  args.push("-ss", String(t.ini), "-t", String(t.dur), "-i", path.join(brutos, t.arq), "-i", png);
  filtros.push(`[${i * 2}:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=30,setsar=1[b${i}];[b${i}][${i * 2 + 1}:v]overlay=0:0,format=yuv420p[v${i}]`);
  filtros.push(`[${i * 2}:a]aresample=44100,aformat=channel_layouts=stereo,volume=0.35[a${i}]`);
}
const n = TRECHOS.length, fimPng = path.join(saida, "fim.png");
await sharp(Buffer.from(fim)).png().toFile(fimPng);
args.push("-loop", "1", "-t", String(FINAL), "-i", fimPng, "-f", "lavfi", "-t", String(FINAL), "-i", "anullsrc=r=44100:cl=stereo");
filtros.push(`[${n * 2}:v]fps=30,setsar=1,format=yuv420p[v${n}]`, `[${n * 2 + 1}:a]anull[a${n}]`);
const dur = TRECHOS.reduce((s, t) => s + t.dur, 0) + FINAL;
const trilha = trilhaPropria({ uso: "story", semente: DIA2 ? "2026-11-21-chegada" : "2026-11-20-chegada", plano: [{ de: 0, ate: 0.5, nivel: "magro" }, { de: 0.5, ate: dur, nivel: "cheio" }],
  duracao: dur, saida: path.join(saida, "trilha-chegada.m4a"), env: { TRILHA_PROPRIA: "1" } });
if (!trilha) throw new Error("trilha própria não montou");
args.push("-i", trilha.path);
const idxTrilha = n * 2 + 2;
filtros.push(`${Array.from({ length: n + 1 }, (_, i) => `[v${i}][a${i}]`).join("")}concat=n=${n + 1}:v=1:a=1[v][amb]`);
filtros.push(`[${idxTrilha}:a]volume=0.55,afade=t=out:st=${dur - 1.2}:d=1.2[m];[amb][m]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5[a]`);
const out = path.join(saida, DIA2 ? "story-chegada2.mp4" : "story-chegada.mp4");
args.push("-filter_complex", filtros.join(";"), "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-movflags", "+faststart", "-t", String(dur), out);
const r = spawnSync("ffmpeg", args, { stdio: "inherit" });
if (r.status !== 0) throw new Error("ffmpeg falhou");
console.log("story:", out, `${dur.toFixed(1)} s | trilha:`, trilha.name);
