// Bug 24/10/2026: o final do story saía sem áudio (Andre: "o final do stories não tá saindo o áudio"). O story de
// 24/10 tinha vídeo de 23,6 s e áudio de 20,7 s. Causa: o loudnorm da música sai em 192 kHz e o amix com a voz
// (44,1 kHz) cortava o fim; além disso o ducking acabava junto com a última fala. O teste mixa de verdade as falas
// gravadas do story de 24/10 num vídeo do mesmo tamanho e compara a duração do áudio com a do vídeo.
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { filtroMixagem, mixarNarracao } from "../publish/narracao/narracao.mjs";
import { pastaTemp } from "../lib/pasta-temp.mjs";

const RAIZ = new URL("../../", import.meta.url).pathname;
const NARR = path.join(RAIZ, "media/news/instagram-stories/narracao");
const FALAS = [
  { sceneIndex: 0, arquivo: path.join(NARR, "datas/bella-10-24-b55b3c2c.mp3") },
  { sceneIndex: 1, arquivo: path.join(NARR, "finais/bella-fdae98d2.mp3") },
];
const TOTAL = 23.48, OUTRO_INICIO = 18.65; // mesma linha do tempo do story de 24/10
const ANTIGO = filtroMixagem(FALAS, [0, OUTRO_INICIO]).replace(";[ch]apad[chave]", "").replace("[voz][ch]", "[voz][chave]")
  .replaceAll(",aresample=44100", "");

const dur = (f, s) => Number(spawnSync("ffprobe", ["-v", "error", "-select_streams", `${s}:0`, "-show_entries", "stream=duration",
  "-of", "csv=p=0", f], { encoding: "utf8" }).stdout.trim());

function videoBase(dir) {
  const f = path.join(dir, "in.mp4");
  // áudio 48 kHz estéreo, como o MP4 que o story-video entrega
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", `color=c=black:s=180x320:r=30:d=${TOTAL}`,
    "-f", "lavfi", "-i", `sine=frequency=220:sample_rate=48000:duration=${TOTAL}`, "-ac", "2",
    "-c:v", "libx264", "-c:a", "aac", "-shortest", f]);
  assert.equal(r.status, 0);
  return f;
}

function mixarCom(filtro, dir) {
  const entrada = videoBase(dir), saida = path.join(dir, "out.mp4");
  const r = spawnSync("ffmpeg", ["-y", "-v", "error", "-i", entrada, ...FALAS.flatMap((f) => ["-i", f.arquivo]),
    "-filter_complex", filtro, "-map", "0:v", "-map", "[aout]", "-c:v", "copy", "-c:a", "aac", saida]);
  assert.equal(r.status, 0);
  return saida;
}

test("mixagem antiga cortava os segundos finais do áudio (prova do bug)", () => {
  const f = mixarCom(ANTIGO, pastaTemp("regressao-final-"));
  assert.ok(dur(f, "v") - dur(f, "a") > 2, `áudio ${dur(f, "a")} s, vídeo ${dur(f, "v")} s`);
});

test("mixagem atual: áudio vai até o fim do vídeo", async () => {
  const dir = pastaTemp("regressao-final-"), saida = path.join(dir, "out.mp4");
  await mixarNarracao(videoBase(dir), saida, { falas: FALAS, scenes: [{ start: 0 }, { start: OUTRO_INICIO }] });
  assert.ok(Math.abs(dur(saida, "v") - dur(saida, "a")) < 0.1, `áudio ${dur(saida, "a")} s, vídeo ${dur(saida, "v")} s`);
});
