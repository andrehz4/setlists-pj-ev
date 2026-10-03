// Regra 0 global: arquivo de código com no máximo 160 linhas (arquivo curto = fácil de ler e editar,
// por gente e por agente de IA). Os arquivos antigos maiores ficam na lista abaixo com o tamanho de hoje
// como TETO: podem diminuir (e sair da lista ao caber em 160), nunca crescer. Arquivo novo não entra na lista.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { RAIZ } from "./config.mjs";

const LIMITE = 160;
const PASTAS = ["scripts", "mock-ig", "colab", "functions"];
const PULA = /node_modules|[\\/]dist[\\/]/;

const EXCECOES = {
  "mock-ig/server.mjs": 697,
  "scripts/news/youtube/capsulas-grid.mjs": 344,
  "scripts/publish/story-styles/caderno-b.mjs": 307,
  "scripts/publish/run-publish-story.mjs": 277,
  "scripts/publish/reel.test.mjs": 275,
  "scripts/news/dedupe-history.mjs": 268,
  "scripts/publish/story-styles/editorial-badge.mjs": 264,
  "scripts/publish/facebook.mjs": 257,
  "scripts/publish/run-publish-reel.mjs": 253,
  "scripts/publish/queue-select.test.mjs": 226,
  "scripts/publish/telegram-bot.mjs": 219,
  "scripts/publish/run-publish-capsula.mjs": 213,
  "mock-ig/mock.test.mjs": 211,
  "mock-ig/preview.mjs": 201,
  "scripts/news/youtube/reordenar-fila.mjs": 199,
  "scripts/publish/facebook.test.mjs": 198,
  "scripts/publish/story-styles/brutalist.mjs": 183,
  "scripts/news/reddit-community.mjs": 172,
  "scripts/publish/narracao/narracao.test.mjs": 171,
  "scripts/cifras-coverage.test.mjs": 170,
  "scripts/news/fotos-commons.mjs": 161,
};

function arquivos() {
  const out = [];
  const anda = (d) => {
    for (const e of fs.readdirSync(path.join(RAIZ, d), { withFileTypes: true })) {
      const rel = path.join(d, e.name);
      if (PULA.test(rel + "/")) continue;
      if (e.isDirectory()) anda(rel);
      else if (/\.(mjs|js)$/.test(e.name)) out.push(rel.split(path.sep).join("/"));
    }
  };
  PASTAS.forEach(anda);
  return out;
}

test("regra 0: arquivo novo até 160 linhas; exceção antiga nunca cresce", () => {
  const erros = [];
  for (const f of arquivos()) {
    const n = fs.readFileSync(path.join(RAIZ, f), "utf8").split("\n").length;
    const teto = EXCECOES[f] ?? LIMITE;
    if (n > teto) erros.push(`${f}: ${n} linhas (teto ${teto})`);
  }
  assert.deepEqual(erros, [], "fatie o arquivo (um módulo por responsabilidade) em vez de subir o teto");
});

test("regra 0: exceção que já cabe em 160 sai da lista", () => {
  const sobrando = Object.keys(EXCECOES).filter((f) => {
    const p = path.join(RAIZ, f);
    return !fs.existsSync(p) || fs.readFileSync(p, "utf8").split("\n").length <= LIMITE;
  });
  assert.deepEqual(sobrando, [], "tire estes arquivos de EXCECOES em scripts/regra-zero.test.mjs");
});
