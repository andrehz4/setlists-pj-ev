// Story no padrão do reel (flag STORY_TRANSICOES=1): troca a abertura própria do story
// pela abertura do reel (clipe do acervo + SMUFDPJ se montando + tarja "AS NOTÍCIAS DO
// DIA"), na MESMA duração (a voz da data segue sincronizada), e põe as transições de
// clipe entre os cards. Opera no MP4 pronto; qualquer falha devolve o vídeo intacto.
import "../fontconfig-boot.mjs";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
import { FPS, measureText, F_ANTON, F_INTER_SB, F_INTER_XB } from "../reel/base.mjs";
import { coldOpenSvg } from "../reel/cenas-abertura-final.mjs";
import { montarAbertura, aplicarTransicoes } from "../reel/transicoes.mjs";

export const TARJA = "AS NOTÍCIAS DO DIA";
const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
export const rotuloDia = (d) => `${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;

// Início de cada cena do story (abertura, cards, final), pras transições.
export function cenasDoStory({ introDur, cards, cardDur, outroInicio }) {
  return [{ start: 0 }, ...Array.from({ length: cards }, (_, i) => ({ start: introDur + i * cardDur })), { start: outroInicio }];
}

async function camadas(dir, { dur, itemCount, rotulo, accent }) {
  fs.mkdirSync(dir, { recursive: true });
  const letterWidths = [];
  for (const L of "SMUFDPJ") letterWidths.push(await measureText(L, { size: 230, family: F_ANTON }));
  const tarjaTextW = await measureText(TARJA, { size: 32, family: F_INTER_XB, weight: 800, letterSpacing: 32 * 0.16 });
  const chipTextW = await measureText("CLIPE · MUDO", { size: 24, family: F_INTER_SB, weight: 600, letterSpacing: 3.4 });
  const n = Math.round(dur * FPS);
  for (let i = 0; i < n; i++) {
    const svg = coldOpenSvg(i / FPS, { accent, itemCount, rangeLabel: rotulo, dark: 0.6, letterWidths, tarjaTextW, chipTextW,
      showChip: true, comFlash: false, tarja: TARJA, dur });
    await sharp(Buffer.from(svg)).png({ compressionLevel: 3 }).toFile(path.join(dir, `c_${String(i).padStart(4, "0")}.png`));
  }
}

// Devolve { abertura: bool, transicoes: n }. Nunca lança: erro = vídeo do jeito que estava.
export async function aplicarPadraoReel(video, { introDur, cards, cardDur, outroInicio, date, accent, tmpDir }) {
  const out = { abertura: false, transicoes: 0 };
  const semente = date.toISOString().slice(0, 10);
  try {
    const clipe = montarAbertura(tmpDir, { semente, dur: introDur });
    if (clipe) {
      const dir = path.join(tmpDir, "story-camada");
      await camadas(dir, { dur: introDur, itemCount: cards, rotulo: rotuloDia(date), accent });
      const tmp = video.replace(/\.mp4$/, ".ab.mp4");
      const f = `[1:v]setsar=1[cl];[2:v]format=rgba[ov];[cl][ov]overlay=0:0:shortest=1[ab];` +
        `[0:v]trim=start=${introDur.toFixed(3)},setpts=PTS-STARTPTS,setsar=1[resto];[ab][resto]concat=n=2:v=1:a=0[v]`;
      const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", video, "-i", clipe, "-framerate", String(FPS), "-i", path.join(dir, "c_%04d.png"),
        "-filter_complex", f, "-map", "[v]", "-map", "0:a?", "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "copy",
        "-movflags", "+faststart", tmp], { encoding: "utf8" });
      if (r.status === 0) { fs.renameSync(tmp, video); out.abertura = true; }
      else { fs.rmSync(tmp, { force: true }); console.warn(`[story] abertura com clipe falhou: ${(r.stderr || "").slice(-200)}`); }
    }
  } catch (e) { console.warn(`[story] abertura com clipe falhou: ${e.message}`); }
  try { out.transicoes = aplicarTransicoes(video, { scenes: cenasDoStory({ introDur, cards, cardDur, outroInicio }), semente }); }
  catch (e) { console.warn(`[story] transições falharam: ${e.message.slice(0, 200)}`); }
  return out;
}
