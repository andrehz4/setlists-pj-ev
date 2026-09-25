// Prepara a mídia do envio pro Gemini (inline, abaixo de ~18 MB no total):
// fotos reduzidas pra 1280px; vídeo CORTADO no trecho escolhido, 480p, COM áudio
// (a IA precisa ouvir pra checar música de fundo).

import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";

const run = promisify(execFile);
const LIMITE = 18 * 1024 * 1024;

async function baixar(url) {
  if (!url) throw new Error("mídia sem URL (R2 não configurado?)");
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download da mídia falhou: HTTP ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

async function foto(url) {
  const jpg = await sharp(await baixar(url)).rotate().resize(1280, 1280, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
  return { inlineData: { mimeType: "image/jpeg", data: jpg.toString("base64") } };
}

async function video(url, opts) {
  const pasta = await mkdtemp(join(tmpdir(), "contrib-"));
  try {
    const entrada = join(pasta, "in");
    await writeFile(entrada, await baixar(url));
    const ini = Math.max(0, opts?.trim_start || 0);
    const dur = Math.max(1, (opts?.trim_end || 90) - ini);
    for (const crf of [32, 38]) {
      const saida = join(pasta, `out-${crf}.mp4`);
      await run("ffmpeg", ["-y", "-v", "error", "-ss", String(ini), "-t", String(dur), "-i", entrada,
        "-vf", "scale=-2:480", "-r", "24", "-c:v", "libx264", "-preset", "veryfast", "-crf", String(crf),
        "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", saida]);
      if ((await stat(saida)).size <= LIMITE) {
        return { inlineData: { mimeType: "video/mp4", data: (await readFile(saida)).toString("base64") } };
      }
    }
    throw new Error("vídeo continua grande demais pra curadoria mesmo comprimido");
  } finally {
    await rm(pasta, { recursive: true, force: true });
  }
}

export async function prepararMidia(envio) {
  const ehVideo = (m) => /\.(mp4|mov)$/i.test(m.key);
  const partes = [];
  for (const m of envio.media) partes.push(ehVideo(m) ? await video(m.url, envio.video) : await foto(m.url));
  return partes;
}
