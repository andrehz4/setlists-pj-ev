import test from "node:test";
import assert from "node:assert/strict";
import { focoDoCentro, trilhaSuave } from "./rosto.mjs";

test("foco põe o rosto no meio do recorte 9:16", () => {
  assert.equal(focoDoCentro(0.5, 0.3164), 0.5);
  assert.equal(focoDoCentro(0.1, 0.3164), 0); // rosto na borda: recorte encosta na esquerda
  assert.equal(focoDoCentro(0.95, 0.3164), 1);
});

test("trilha: preenche buracos, suaviza, limita velocidade e devolve null sem rosto", () => {
  const pts = [0, 0.1, 0.2, 0.3, 0.4].map((t) => ({ t }));
  assert.equal(trilhaSuave(pts), null);
  pts[0] = { t: 0, x: 0.2, conf: 0.9 }; pts[4] = { t: 0.4, x: 0.8, conf: 0.9 };
  const tr = trilhaSuave(pts, { maxPorSeg: 1 });
  assert.equal(tr.length, 5);
  for (let i = 1; i < tr.length; i++) assert.ok(Math.abs(tr[i].foco - tr[i - 1].foco) <= 0.1 + 1e-9, "andou rápido demais");
  assert.ok(tr.at(-1).foco > tr[0].foco);
  assert.equal(trilhaSuave([{ t: 0, x: 0.5, conf: 0.2 }]), null); // confiança baixa não conta
});
