// Trilha própria: plano de níveis, envelope por família e escolha do trecho da faixa.
// Regressões de 13/11/2026: (1) loudnorm comprimia o áudio curto e apagava o golpe; (2) abertura muda quando o
// piano não tocava no trecho escolhido. As duas são cobertas pelo envelope (magro só com a família escolhida) e
// pelos candidatos de início.
import { test } from "node:test";
import assert from "node:assert/strict";
import { planoReel, planoStory, golpesDoPlano } from "./plano.mjs";
import { envelope, expressao } from "./mixar.mjs";
import { iniciosCandidatos, NIVEIS } from "./kit.mjs";

test("reel: golpes na manchete líder (3 s) e depois do respiro (25,5 s), 41,5 s no total", () => {
  const p = planoReel(8);
  assert.deepEqual(golpesDoPlano(p), [3, 25.5]);
  assert.equal(p[0].nivel, "magro");
  assert.equal(p.at(-1).nivel, "magro");
  assert.equal(p.at(-1).ate, 41.5);
  for (let i = 1; i < p.length; i++) assert.equal(p[i].de, p[i - 1].ate, "plano sem buraco");
});

test("story: cada troca de manchete é um golpe", () => {
  const p = planoStory([1.5, 6, 11], 15);
  assert.deepEqual(golpesDoPlano(p), [1.5, 6, 11]);
});

test("bateria muda no magro e inteira no cheio; golpe seco, descida suave", () => {
  const p = planoReel(8);
  const pts = envelope("bateria", p, 41.5, "teclado");
  const em = (t) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [a, ga] = pts[i], [b, gb] = pts[i + 1];
      if (t >= a && t <= b) return b === a ? gb : ga + (gb - ga) * (t - a) / (b - a);
    }
    return pts.at(-1)[1];
  };
  assert.equal(em(1), 0);
  assert.ok(em(3.1) > 0.99, "bateria inteira 100 ms depois do golpe");
  assert.equal(em(23), 0);
  assert.ok(em(41.5) < 0.01, "fade no fim");
});

test("no magro só toca a família escolhida (abertura nunca vem com a banda)", () => {
  const p = planoReel(8);
  assert.ok(envelope("guitarra", p, 41.5, "guitarra")[0][1] > 0);
  assert.equal(envelope("teclado", p, 41.5, "guitarra")[0][1], 0);
  assert.equal(envelope("baixo", p, 41.5, "guitarra")[0][1], 0);
});

test("expressão do ffmpeg só com números e funções conhecidas", () => {
  const e = expressao(envelope("baixo", planoReel(8), 41.5));
  assert.match(e, /^min\(.*,1\.5\)$/);
  assert.doesNotMatch(e, /NaN|undefined|Infinity/);
});

test("candidatos de início cabem na faixa e incluem as partes cheias", () => {
  const cama = { duracao_s: 200, comeco_sem_bateria_s: 10,
    partes: [{ de: 0, nivel: "medio" }, { de: 60, nivel: "cheio" }, { de: 190, nivel: "cheio" }] };
  const c = iniciosCandidatos(cama, 3, 41.5);
  assert.ok(c.includes(57));
  assert.ok(c.every((x) => x >= 0 && x <= 200 - 41.5 - 0.5));
});

test("níveis: médio mais leve que o cheio em toda família", () => {
  for (const [fam, db] of Object.entries(NIVEIS.medio)) assert.ok(db <= (NIVEIS.cheio[fam] ?? 0), fam);
});
