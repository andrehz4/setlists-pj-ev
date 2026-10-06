// Monta o MP4 do story por banda: quadros SVG (30 fps) por cima dos trechos de b-roll, mais voz, whoosh e trilha.
// Uso de teste: renderizarStory({ story, logo, clipes:[abertura, corte1, corte2], falas:{abertura,estado,...}, trilha, saida })
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { p, move, lerp, momento, DURACAO, FALAS, ROTEIRO } from "./tempo.mjs";
import { COR, TEMAS, carimbo } from "./pecas.mjs";
import { titulo, logo, final } from "./cenas-a.mjs";
import { mapa, shows } from "./cenas-b.mjs";

const { default: sharp } = await import("sharp");
const FPS = 30;

export function quadroSvg(r, story, cor, logoUri) {
  const { T } = momento(r);
  if (T === null) return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"/>`;
  const painel = lerp(1920, 0, p(T, 2.7, 0.6, move));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  ${painel < 1920 ? `<rect x="0" y="${painel}" width="1080" height="${1920 - painel}" fill="${cor.bg}"/>` : ""}
  ${mapa(T, story, cor)}${shows(T, story, cor)}${logo(T, story, logoUri)}${titulo(T, story, cor)}${carimbo(T)}${final(T, cor)}</svg>`;
}

// Logo quadrado a partir da foto de perfil tratada (640x480 com o logo 400x400 no meio).
export async function logoDaFoto(arquivo) {
  const buf = await sharp(arquivo).extract({ left: 120, top: 40, width: 400, height: 400 }).png().toBuffer();
  return `data:image/png;base64,${buf.toString("base64")}`;
}

const ff = (args) => { const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" }); if (r.status) throw new Error("ffmpeg falhou"); };

export async function renderizarStory({ story, tema = "azul", logo: logoArq, clipes, falas, trilha, saida }) {
  const cor = { bg: TEMAS[tema], pin: tema === "vermelho" ? COR.tinta : COR.pin, strip: tema === "vermelho" ? COR.tinta : COR.pin };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "story-banda-"));
  const logoUri = logoArq ? await logoDaFoto(logoArq) : null;
  const total = Math.round(DURACAO * FPS);
  for (let i = 0; i < total; i++) {
    await sharp(Buffer.from(quadroSvg(i / FPS, story, cor, logoUri))).png({ compressionLevel: 1 }).toFile(path.join(tmp, `q${String(i).padStart(4, "0")}.png`));
  }
  // base: cor do dia + clipe de abertura (0 a 3.4 s) + cortes de b-roll nos trechos do roteiro
  const cortes = ROTEIRO.filter((s) => s.broll !== undefined);
  const em = [{ r0: 0, r1: 3.4 }, ...cortes];
  const corte9x16 = "crop=ih*9/16:ih,scale=1080:1920,setsar=1,fps=30";
  const entradas = ["-f", "lavfi", "-i", `color=c=${cor.bg}:s=1080x1920:r=30:d=${DURACAO}`];
  let fc = "", ult = "0:v";
  em.forEach((s, k) => {
    entradas.push("-stream_loop", "-1", "-i", clipes[k]);
    fc += `[${k + 1}:v]${corte9x16},trim=0:${(s.r1 - s.r0).toFixed(2)},setpts=PTS-STARTPTS+${s.r0}/TB[c${k}];`;
    fc += `[${ult}][c${k}]overlay=enable='between(t,${s.r0},${s.r1})':eof_action=pass[b${k}];`;
    ult = `b${k}`;
  });
  const nq = em.length + 1;
  entradas.push("-framerate", String(FPS), "-i", path.join(tmp, "q%04d.png"));
  fc += `[${ult}][${nq}:v]overlay=format=auto[v];`;
  // áudio: falas nos seus tempos, trilha baixa por baixo
  const audios = FALAS.filter((f) => falas[f.chave]);
  audios.forEach((f) => entradas.push("-i", falas[f.chave]));
  entradas.push("-stream_loop", "-1", "-i", trilha);
  const ia = nq + 1;
  audios.forEach((f, k) => { fc += `[${ia + k}:a]${f.atempo ? `atempo=${f.atempo},` : ""}aresample=44100,aformat=channel_layouts=stereo,adelay=${Math.round(f.em * 1000)}|${Math.round(f.em * 1000)}[a${k}];`; });
  fc += `[${ia + audios.length}:a]aresample=44100,aformat=channel_layouts=stereo,volume=0.16,afade=t=out:st=${DURACAO - 1.2}:d=1.2,atrim=0:${DURACAO}[mus];`;
  fc += `${audios.map((_, k) => `[a${k}]`).join("")}[mus]amix=inputs=${audios.length + 1}:normalize=0:duration=longest,atrim=0:${DURACAO}[a]`;
  ff([...entradas, "-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-t", String(DURACAO), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast", "-crf", "20", "-c:a", "aac", "-b:a", "160k", saida]);
  fs.rmSync(tmp, { recursive: true, force: true });
  return saida;
}
