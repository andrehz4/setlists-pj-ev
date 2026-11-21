// Reel "Rolou!": a previsão de 18/11 (Eddie sobe no palco do Roger Daltrey no sábado?) se confirmou em 21/11.
// Abre com a capa do carrossel da previsão, corta pro vídeo do Andre SEM o som ao vivo (pedido dele: a voz dele não
// pode aparecer), narração ElevenLabs (voz.mp3, Liam v4) e trilha própria baixa por baixo.
// Uso: node reels-especiais/eddie-roger-rolou/gera.mjs <video> [inicio_s]  ->  saida/reel.mp4 (1080x1920, 20 s)
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { trilhaPropria } from "../../scripts/publish/trilha/ligar.mjs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const saida = path.join(dir, "saida");
fs.mkdirSync(saida, { recursive: true });
const [video, inicio = "0"] = process.argv.slice(2);
if (!video) throw new Error("uso: gera.mjs <video> [inicio_s]");
const W = 1080, H = 1920, INTRO = 4.65, FIM = 1.4, DUR = 20.2;
const VID = DUR - INTRO - FIM;
const COR = { fundo: "#14110F", amarelo: "#FFCC1A", vermelho: "#E0361C", claro: "#FFFFFF" };
const selo = `data:image/jpeg;base64,${fs.readFileSync(path.join(dir, "..", "story-ao-vivo", "selo-smufdpj.jpg")).toString("base64")}`;
const capa = `data:image/jpeg;base64,${fs.readFileSync(path.join(dir, "..", "eddie-daltrey", "saida", "01.jpg")).toString("base64")}`;

const svg = (corpo, fundo = "") => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${fundo}${corpo}</svg>`;
const faixa = (y, txt, tam, cor, corTxt) => `<rect x="60" y="${y}" width="${Math.round(txt.length * tam * 0.5) + 60}" height="${tam * 1.25}" fill="${cor}"/>
  <text x="90" y="${y + tam * 1.02}" font-family="Anton" font-size="${tam}" fill="${corTxt}">${txt}</text>`;
const topo = `<clipPath id="cs"><circle cx="964" cy="190" r="54"/></clipPath><image href="${selo}" x="910" y="136" width="108" height="108" clip-path="url(#cs)"/>
  <circle cx="964" cy="190" r="54" fill="none" stroke="${COR.amarelo}" stroke-width="5"/>`;

// Telas: intro (capa da previsão), legendas sobre o vídeo e cartão final
const telas = {
  intro: svg(`<image href="${capa}" x="0" y="420" width="1080" height="1350"/>${topo}
    ${faixa(200, "18/11 A GENTE PERGUNTOU", 76, COR.amarelo, COR.fundo)}`, `<rect width="100%" height="100%" fill="${COR.fundo}"/>`),
  rolou: svg(`<g transform="rotate(-8 540 960)"><rect x="90" y="760" width="900" height="330" fill="${COR.vermelho}"/>
    <text x="540" y="1015" text-anchor="middle" font-family="Anton" font-size="260" fill="${COR.claro}">ROLOU!</text></g>`),
  musicas: svg(`${topo}${faixa(1300, "OS DOIS CANTARAM", 80, COR.amarelo, COR.fundo)}${faixa(1420, "PINBALL WIZARD", 96, COR.claro, COR.fundo)}${faixa(1555, "THE KIDS ARE ALRIGHT", 80, COR.claro, COR.fundo)}`),
  stat: svg(`${topo}${faixa(1300, "PINBALL WIZARD", 96, COR.amarelo, COR.fundo)}${faixa(1435, "0 VEZES INTEIRA", 96, COR.claro, COR.fundo)}${faixa(1570, "ANTES DE HOJE · SETLIST.FM", 52, COR.claro, COR.fundo)}`),
  acertou: svg(`${topo}${faixa(1380, "QUEM COMENTOU SIM", 96, COR.amarelo, COR.fundo)}${faixa(1515, "ACERTOU", 96, COR.claro, COR.fundo)}`),
  amanha: svg(`${topo}${faixa(1380, "AMANHÃ TEM", 96, COR.amarelo, COR.fundo)}${faixa(1515, "EDDIE DE NOVO", 96, COR.claro, COR.fundo)}`),
  fim: svg(`<text x="72" y="860" font-family="Anton" font-size="190" fill="${COR.claro}">SEGUE A</text>
    <text x="72" y="1060" font-family="Anton" font-size="190" fill="${COR.amarelo}">COBERTURA</text>
    <rect x="0" y="1240" width="${W}" height="150" fill="${COR.amarelo}"/><text x="72" y="1342" font-family="Anton" font-size="80" fill="${COR.fundo}">@SMUFDPJ · IBIRAPUERA</text>`,
    `<rect width="100%" height="100%" fill="${COR.fundo}"/>`),
};
const png = {};
for (const [k, s] of Object.entries(telas)) { png[k] = path.join(saida, `${k}.png`); await sharp(Buffer.from(s)).png().toFile(png[k]); }

// Legendas casadas com as pausas da narração (silencedetect em voz.mp3) + 0,3 s de atraso da voz; tempos relativos ao vídeo
const LEG = [["rolou", 0, 1.2], ["musicas", 0.7, 5.6], ["stat", 5.6, 9.6], ["acertou", 9.6, 11.8], ["amanha", 11.8, VID]];
const trilha = trilhaPropria({ uso: "reel", semente: "2026-11-21-rolou", plano: [{ de: 0, ate: DUR, nivel: "magro" }],
  duracao: DUR, saida: path.join(saida, "trilha.m4a"), env: { TRILHA_PROPRIA: "1" } });
if (!trilha) throw new Error("trilha própria não montou");

const args = ["-y", "-hide_banner", "-loglevel", "error",
  "-loop", "1", "-t", String(INTRO), "-i", png.intro,
  "-ss", inicio, "-t", String(VID), "-an", "-i", video,
  "-loop", "1", "-t", String(FIM), "-i", png.fim,
  ...LEG.flatMap(([k]) => ["-i", png[k]]),
  "-i", path.join(dir, "voz.mp3"), "-i", trilha.path];
const f = [`[0:v]scale=1188:2112,zoompan=z='1':x='(iw-${W})/2*(1-on/${INTRO * 30})':y='(ih-${H})/2':d=1:s=${W}x${H}:fps=30,setsar=1,format=yuv420p[vi]`,
  `[1:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=30,setsar=1[v0]`];
LEG.forEach(([, de, ate], i) => f.push(`[v${i}][${3 + i}:v]overlay=0:0:enable='between(t,${de},${ate})'[v${i + 1}]`));
const nL = LEG.length, iVoz = 3 + nL;
f.push(`[v${nL}]format=yuv420p[vv]`, `[2:v]fps=30,setsar=1,format=yuv420p[vf]`, `[vi][vv][vf]concat=n=3:v=1:a=0[v]`,
  `[${iVoz}:a]adelay=300|300,apad[voz]`, `[${iVoz + 1}:a]volume=0.22,afade=t=out:st=${DUR - 1}:d=1[m]`,
  `[voz][m]amix=inputs=2:duration=longest:normalize=0,atrim=0:${DUR},loudnorm=I=-14:TP=-1.5[a]`);
const out = path.join(saida, "reel.mp4");
args.push("-filter_complex", f.join(";"), "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
  "-b:v", "8M", "-maxrate", "10M", "-bufsize", "16M", "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-movflags", "+faststart", "-t", String(DUR), out);
if (spawnSync("ffmpeg", args, { stdio: "inherit" }).status !== 0) throw new Error("ffmpeg falhou");
console.log("reel:", out, `${DUR} s | trilha:`, trilha.name);
