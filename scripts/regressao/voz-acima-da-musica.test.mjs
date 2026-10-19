// Bug 18/10/2026: no reel narrado a música ficava 2,3 dB ACIMA da voz mesmo com o ducking (Andre: "a música está
// muito alta, a voz tem que sobressair"). O teste mede de verdade: roda o filtro de mixagem com cada trilha do acervo
// e uma fala gravada, separa a voz da música já abaixada e compara o volume médio.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { filtroMixagem } from "../publish/narracao/narracao.mjs";

const RAIZ = new URL("../../", import.meta.url).pathname;
const TRILHAS = path.join(RAIZ, "scripts/publish/assets/story-tracks");
const VOZ = path.join(RAIZ, "media/news/instagram-reels/narracao/liam-final-75e04fdf.mp3");
const MARGEM_MIN = 8; // dB de voz acima da música
const ANTIGO = "[0:a][chave]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[musica]";

const db = (a) => Number(spawnSync("ffmpeg", ["-i", a, "-af", "volumedetect", "-f", "null", "-"], { encoding: "utf8" }).stderr.match(/mean_volume: (-?[\d.]+)/)[1]);
function margem(trilha, filtro) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "regressao-mix-"));
  const f = filtro.replace(/;\[musica\]\[voz\]amix.*$/, "");
  spawnSync("ffmpeg", ["-y", "-v", "error", "-t", "6", "-i", trilha, "-i", VOZ, "-filter_complex", f,
    "-map", "[musica]", "-t", "5", path.join(dir, "m.wav"), "-map", "[voz]", "-t", "5", path.join(dir, "v.wav")]);
  const m = db(path.join(dir, "v.wav")) - db(path.join(dir, "m.wav"));
  fs.rmSync(dir, { recursive: true, force: true });
  return m;
}
const trilhas = fs.readdirSync(TRILHAS).filter((f) => /^\d{2}-.*\.mp3$/i.test(f)).map((f) => path.join(TRILHAS, f));
const atual = filtroMixagem([{ sceneIndex: 0 }], [0]);
const antigo = atual.replace(/\[0:a\][^;]+;\[cama\]\[chave\]sidechaincompress=[^[]+\[musica\]/, ANTIGO);

test("mixagem antiga deixava a música por cima da voz (prova do bug)", () => {
  assert.notEqual(antigo, atual);
  assert.ok(margem(trilhas[0], antigo) < 0);
});

for (const t of trilhas) {
  test(`voz sobressai à música: ${path.basename(t)}`, () => {
    const m = margem(t, atual);
    assert.ok(m >= MARGEM_MIN, `voz só ${m.toFixed(1)} dB acima`);
  });
}
