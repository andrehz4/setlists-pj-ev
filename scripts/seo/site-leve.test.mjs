// O index.html não volta a engordar: dados ficam em dados/*.js, CSS em css/app.css, letras em media/letras/.
// Motivo: arquivo de 21 mil linhas e 940 KB era ilegível pra agente de IA (cada linha de dado estourava a leitura).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { naRaiz } from "../config.mjs";

const html = fs.readFileSync(naRaiz("index.html"), "utf8");

test("index.html sem linha gigante (dado embutido vai pra dados/*.js)", () => {
  const grandes = html.split("\n").map((l, i) => [i + 1, l.length]).filter(([, n]) => n > 3000);
  assert.deepEqual(grandes, [], "linhas enormes no index.html: mova o dado pra dados/");
});

test("index.html sem <style> grande (CSS do site em css/app.css)", () => {
  for (const [, css] of html.matchAll(/<style>([\s\S]*?)<\/style>/g)) {
    assert.ok(css.split("\n").length <= 40, "bloco <style> grande no index.html: use css/app.css");
  }
});

test("dados/*.js carregam antes do script principal e existem", () => {
  const tags = [...html.matchAll(/<script src="(dados\/[^"]+)"><\/script>/g)].map((m) => m[1]);
  assert.deepEqual(tags, ["dados/shows.js", "dados/albums.js", "dados/songs-db.js", "dados/media-manifest.js", "dados/fotos-reserva.js"]);
  for (const t of tags) assert.ok(fs.existsSync(naRaiz(t)), t);
  assert.ok(html.indexOf(tags.at(-1)) < html.indexOf("DATA (injected"), "dados precisam vir antes do script principal");
});
