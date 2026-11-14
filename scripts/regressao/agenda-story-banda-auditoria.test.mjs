// Auditoria 14/11/2026 dos layouts novos do story por banda (Q a Z):
// 1. story-por-banda.mjs só gravava o log de publicados DEPOIS do loop: job morto no meio (timeout com layout pesado)
//    deixava bandas já no IG sem registro, e a reserva republicava. Agora grava e commita por banda, e falha numa
//    banda não derruba as seguintes.
// 2. Layout W punha "@" em casa sem Instagram ("@Cervejaria Ahtrio", perfil que não existe).
// 3. Layout Q: cidade longa + show sem hora sobrepunha cidade e "ver perfil".
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { temaDoLayout } from "../agenda/redes/story-banda/layouts/index.mjs";
import { quadroSvg } from "../agenda/redes/story-banda/render.mjs";

const fonte = fs.readFileSync(new URL("../agenda/redes/story-por-banda.mjs", import.meta.url), "utf8");
const loop = fonte.slice(fonte.indexOf("for (const [k, st] of stories.entries())"), fonte.indexOf("fs.rmSync(tmp"));

test("story por banda grava e commita o log DENTRO do loop, logo depois de publicar", () => {
  assert.match(loop, /publishVideoStory[\s\S]*gravarEstado\(LOG, log\)[\s\S]*commitAndPush/);
});

test("falha numa banda é capturada e o loop segue pras próximas", () => {
  assert.match(loop, /try \{[\s\S]*\} catch \(e\) \{[\s\S]*falhas\.push/);
});

const story = (shows) => ({ banda: "Banda Teste", conta: "@teste", contaPura: "teste", cidadeBase: "Franca/SP", desde: 2010,
  dia: "2026-11-14", shows });
const semInsta = { cidade: "São José do Rio Preto", uf: "SP", lonlat: [-49.38, -20.81], casa: "Cervejaria Ahtrio", casaPura: null, hora: null };
const textos = (svg) => [...svg.matchAll(/<text[^>]*font-size="([\d.]+)"[^>]*>([^<]*)<\/text>/g)].map((m) => ({ fs: +m[1], t: m[2] }));

test("W: casa sem Instagram aparece sem @", () => {
  const svg = quadroSvg(12, story([semInsta]), temaDoLayout("W", "azul"), null, "W");
  assert.ok(svg.includes("Cervejaria Ahtrio"), "casa sumiu");
  assert.ok(!svg.includes("@Cervejaria"), "casa sem Instagram ganhou @");
});

test("Q: cidade longa sem hora não encosta em 'ver perfil' e não fica minúscula", () => {
  const t = textos(quadroSvg(12, story([semInsta]), temaDoLayout("Q", "azul"), null, "Q"));
  const cidade = t.find((x) => x.t === semInsta.cidade);
  assert.ok(cidade && cidade.fs >= 36, `cidade com ${cidade?.fs}px`);
  const ver = t.find((x) => x.t === "ver perfil");
  if (ver) assert.ok(330 + semInsta.cidade.length * 0.5 * cidade.fs + 20 < 930 - 10 * 0.5 * ver.fs, "cidade encosta em 'ver perfil'");
  else assert.ok(t.some((x) => x.t.includes("horário no perfil")), "sem hora e sem aviso de horário");
});
