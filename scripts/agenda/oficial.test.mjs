import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { dataOficial, extrairOficial, lerOficial } from "./oficial.mjs";
import { paginaAgenda } from "./pagina.mjs";
import { eventoOficialLd } from "./pagina-oficial.mjs";

const HTML = fs.readFileSync(new URL("./fixtures/pearljam-tour.html", import.meta.url), "utf8");

test("data no formato do site oficial", () => {
  assert.equal(dataOficial("Nov. 20, 2026"), "2026-11-20");
  assert.equal(dataOficial("Sept. 3, 2027"), "2027-09-03");
  assert.equal(dataOficial("June 5, 2026"), "2026-06-05");
  assert.equal(dataOficial("TBA"), null);
});

test("extrai os shows reais de pearljam.com/tour (Eddie Vedder em SP)", () => {
  const s = extrairOficial(HTML, "2026-10-04");
  assert.equal(s.length, 2);
  assert.deepEqual([s[0].data, s[0].artista, s[0].cidade, s[0].brasil], ["2026-11-20", "Eddie Vedder", "São Paulo", true]);
  assert.match(s[0].ingresso, /ticketmaster\.com\.br/);
  assert.equal(extrairOficial(HTML, "2026-11-21").length, 1, "data passada sai");
});

test("formato mudou: erro claro (a coleta mantém a lista de antes)", async () => {
  assert.throws(() => extrairOficial("<html>nada</html>"), /formato mudou/);
  const fetchImpl = async () => ({ ok: false, status: 503 });
  await assert.rejects(lerOficial("2026-10-04", { fetchImpl }), /HTTP 503/);
});

test("página: turnê oficial no topo, com contexto e evento com ingresso", () => {
  const oficial = extrairOficial(HTML, "2026-10-04");
  const html = paginaAgenda({ shows: [], bandas: [], oficial });
  assert.match(html, /Turnê oficial: Pearl Jam e Eddie Vedder/);
  assert.match(html, /20\/11\/2026/);
  assert.match(html, /no Brasil!/);
  assert.match(html, /Ten Club/);
  assert.equal((html.match(/"MusicEvent"/g) || []).length, 2);
  const ld = eventoOficialLd(oficial[0]);
  assert.equal(ld.performer["@type"], "Person");
  assert.match(ld.offers.url, /ticketmaster/);
  assert.match(paginaAgenda({ shows: [], bandas: [], oficial: [] }), /Nenhuma data oficial anunciada/);
});
