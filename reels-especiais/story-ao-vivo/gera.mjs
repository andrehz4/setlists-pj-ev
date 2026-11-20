// Story animado e narrado: "Não vai no show? Fica ligado na página" (cobertura ao vivo do Eddie no Ibirapuera, 20/11).
// Quadros em SVG (sharp) + ffmpeg, narração ElevenLabs (voz.mp3, Liam v4) e cama da trilha própria por baixo.
// Uso: node reels-especiais/story-ao-vivo/gera.mjs  ->  reels-especiais/story-ao-vivo/saida/story.mp4 (1080x1920, 13 s)
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { trilhaPropria } from "../../scripts/publish/trilha/ligar.mjs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const saida = path.join(dir, "saida"), quadros = path.join(saida, "q");
fs.rmSync(quadros, { recursive: true, force: true });
fs.mkdirSync(quadros, { recursive: true });
const W = 1080, H = 1920, FPS = 30, DUR = 13, VOZ_ATRASO = 0.3;
const COR = { fundo: "#140C07", laranja: "#FF7A1A", vermelho: "#E8202A", claro: "#FFFFFF", creme: "#FFF1D6" };
const selo = `data:image/jpeg;base64,${fs.readFileSync(path.join(dir, "selo-smufdpj.jpg")).toString("base64")}`;

// Cenas casadas com as pausas da narração (silencedetect em voz.mp3) + atraso da voz
const CENAS = [
  { ini: 0, fim: 2.4, linhas: ["NÃO VAI", "NO SHOW", "HOJE?"], tag: "EDDIE VEDDER · IBIRAPUERA" },
  { ini: 2.4, fim: 3.9, linhas: ["FICA", "LIGADO", "AQUI"], tag: "@SMUFDPJ" },
  { ini: 3.9, fim: 6.4, linhas: ["A GENTE", "VAI ESTAR", "LÁ"], tag: "PARQUE IBIRAPUERA · SP" },
  { ini: 6.4, fim: 9.3, linhas: ["CADA", "SEGUNDO"], chips: ["VÍDEOS", "STORIES", "LIVES"] },
  { ini: 9.3, fim: DUR, linhas: ["ATIVA AS", "NOTIFI-", "CAÇÕES"], final: true },
];
const easeOut = (x) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);
const pop = (x) => { x = Math.min(Math.max(x, 0), 1); const s = 1.70158; return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function quadro(t) {
  const c = CENAS.find((s) => t >= s.ini && t < s.fim) || CENAS.at(-1);
  const lt = t - c.ini;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="${COR.fundo}"/>`;
  // Faixas diagonais laranja correndo ao fundo (movimento contínuo)
  for (let i = -2; i < 8; i++) {
    const y = ((i * 340 + t * 160) % (340 * 8)) - 400;
    svg += `<rect x="-200" y="${y}" width="1500" height="70" fill="${COR.laranja}" opacity="0.07" transform="rotate(-12 540 960)"/>`;
  }
  // Ponto REC piscando + selo no topo
  const rec = Math.floor(t * 2) % 2 === 0 ? 1 : 0.25;
  svg += `<circle cx="96" cy="190" r="20" fill="${COR.vermelho}" opacity="${rec}"/><text x="132" y="204" font-family="Archivo Black" font-size="40" fill="${COR.claro}">COBERTURA AO VIVO</text>`;
  svg += `<clipPath id="cs"><circle cx="964" cy="190" r="58"/></clipPath><image href="${selo}" x="906" y="132" width="116" height="116" clip-path="url(#cs)"/><circle cx="964" cy="190" r="58" fill="none" stroke="${COR.laranja}" stroke-width="5"/>`;
  // Tag
  if (c.tag) { const a = easeOut(lt / 0.3); svg += `<g opacity="${a}"><rect x="72" y="${560 - 20 * (1 - a)}" width="${c.tag.length * 25 + 40}" height="64" fill="${COR.laranja}"/><text x="92" y="${606 - 20 * (1 - a)}" font-family="Archivo Black" font-size="36" fill="${COR.fundo}">${esc(c.tag)}</text></g>`; }
  // Linhas grandes entrando em cascata, com pop
  const tam = c.linhas.length === 2 ? 250 : 210, y0 = c.linhas.length === 2 ? 900 : 820;
  c.linhas.forEach((l, i) => {
    const p = pop((lt - i * 0.12) / 0.35), op = easeOut((lt - i * 0.12) / 0.2);
    const cor = i === c.linhas.length - 1 ? COR.laranja : COR.claro;
    svg += `<text x="72" y="${y0 + i * tam * 0.95}" font-family="Anton" font-size="${tam}" fill="${cor}" opacity="${op}" transform="translate(${(1 - p) * -120} 0)">${esc(l)}</text>`;
  });
  // Chips (vídeos, stories, lives) estalando um a um
  (c.chips || []).forEach((ch, i) => {
    const k = pop((lt - 0.5 - i * 0.45) / 0.3); if (k <= 0) return;
    const y = 1330 + i * 150, w = ch.length * 54 + 90;
    svg += `<g transform="translate(72 ${y}) scale(${k})"><rect width="${w}" height="120" rx="60" fill="${i === 2 ? COR.vermelho : COR.creme}"/><text x="40" y="84" font-family="Anton" font-size="78" fill="${i === 2 ? COR.claro : COR.fundo}">${ch}</text></g>`;
  });
  if (c.final) {
    const a = easeOut((lt - 0.6) / 0.4), sino = Math.sin(t * 18) * 12 * Math.max(0, 1 - (lt - 0.6) / 1.5);
    svg += `<g opacity="${a}"><g transform="translate(860 1180) rotate(${sino})"><path d="M0 -90 C-60 -90 -70 -30 -70 20 L-90 60 L90 60 L70 20 C70 -30 60 -90 0 -90 Z" fill="${COR.laranja}"/><circle cx="0" cy="82" r="22" fill="${COR.laranja}"/></g>
      <rect x="0" y="1520" width="${W}" height="150" fill="${COR.laranja}"/><text x="72" y="1622" font-family="Anton" font-size="84" fill="${COR.fundo}">E FICA ATENTO · @SMUFDPJ</text></g>`;
  }
  return svg + "</svg>";
}

const total = DUR * FPS;
for (let f = 0; f < total; f++) await sharp(Buffer.from(quadro(f / FPS))).jpeg({ quality: 90 }).toFile(path.join(quadros, `${String(f).padStart(4, "0")}.jpg`));

const plano = [{ de: 0, ate: 0.5, nivel: "magro" }, { de: 0.5, ate: 2.5, nivel: "cheio" }, { de: 2.5, ate: DUR, nivel: "medio" }];
const trilha = trilhaPropria({ uso: "story", semente: "2026-11-20-ao-vivo", plano, duracao: DUR, saida: path.join(saida, "trilha.m4a"), env: { TRILHA_PROPRIA: "1" } });
if (!trilha) throw new Error("trilha própria não montou");
const out = path.join(saida, "story.mp4");
const r = spawnSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-framerate", String(FPS), "-i", path.join(quadros, "%04d.jpg"),
  "-i", path.join(dir, "voz.mp3"), "-i", trilha.path,
  "-filter_complex", `[1:a]adelay=${VOZ_ATRASO * 1000}|${VOZ_ATRASO * 1000},volume=1.6[v];[2:a]volume=0.32,afade=t=out:st=${DUR - 1}:d=1[m];[v][m]amix=inputs=2:duration=longest:normalize=0,atrim=0:${DUR}[a]`,
  "-map", "0:v", "-map", "[a]", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-profile:v", "high", "-r", String(FPS),
  "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-movflags", "+faststart", "-t", String(DUR), out], { stdio: "inherit" });
if (r.status !== 0) throw new Error("ffmpeg falhou");
console.log("story:", out, "| trilha:", trilha.name);
