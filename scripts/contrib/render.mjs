// Render do vídeo do colaborador pro Reel: corte escolhido, 1080x1920 (vídeo que não é
// vertical ganha fundo desfocado dele mesmo), legenda queimada no estilo escolhido (libass),
// voz normalizada pra -14 LUFS e miniatura. Precisa de ffmpeg com libass (o do Ubuntu tem).

import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { gerarAss } from "./legenda-ass.mjs";
import { creditoAutor } from "./post.mjs";

const run = promisify(execFile);
const FONTES = resolve("media/fonts");
const MAX_SEG = 90;

async function temAudio(arquivo) {
  const { stdout } = await run("ffprobe", ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", arquivo]);
  return stdout.trim().length > 0;
}

// Escape de caminho dentro do filtergraph (aspas simples e dois-pontos).
const caminhoFiltro = (p) => `'${p.replace(/\\/g, "/").replace(/'/g, "\\'").replace(/:/g, "\\:")}'`;

export function filtroVideo(assPath) {
  return [
    "[0:v]split=2[a][b]",
    "[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=28:4,eq=brightness=-0.18[fundo]",
    "[b]scale=1080:1920:force_original_aspect_ratio=decrease[frente]",
    `[fundo][frente]overlay=(W-w)/2:(H-h)/2,setsar=1,fps=30,subtitles=${caminhoFiltro(assPath)}:fontsdir=${caminhoFiltro(FONTES)}[v]`,
  ].join(";");
}

export async function renderizar(envio, arquivoEntrada, pasta) {
  const v = envio.video || {};
  const ini = Math.max(0, Number(v.trim_start) || 0);
  const fim = Math.min(Number(v.trim_end) || ini + MAX_SEG, ini + MAX_SEG);
  const dur = Math.max(1, fim - ini);

  const ass = join(pasta, "legenda.ass");
  await writeFile(ass, gerarAss({ estilo: v.estilo || "nenhuma", legendas: v.legendas || [], trimStart: ini, trimEnd: fim, credito: creditoAutor(envio.autor) }));

  const audio = await temAudio(arquivoEntrada);
  const saida = join(pasta, "reel.mp4");
  const args = [
    "-y", "-v", "error", "-ss", String(ini), "-t", String(dur), "-i", arquivoEntrada,
    ...(audio ? [] : ["-f", "lavfi", "-t", String(dur), "-i", "anullsrc=r=48000:cl=stereo"]),
    "-filter_complex", `${filtroVideo(ass)};[${audio ? 0 : 1}:a]loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo[au]`,
    "-map", "[v]", "-map", "[au]", "-t", String(dur),
    "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-profile:v", "high",
    "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-movflags", "+faststart", saida,
  ];
  await run("ffmpeg", args, { maxBuffer: 16 * 1024 * 1024 });

  const miniatura = join(pasta, "miniatura.jpg");
  await run("ffmpeg", ["-y", "-v", "error", "-ss", String(Math.min(1.5, dur / 2)), "-i", saida, "-frames:v", "1", "-q:v", "3", miniatura]);
  return { mp4: saida, miniatura, dur };
}
