// Testa o handler do setlist.fm: parsing de data, formatacao do setlist e filtro de recencia.
// Rodar: node --test scripts/news/setlistfm.test.mjs

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseSetlistDate, formatSetlistText, selectRecentSetlists } from "./setlistfm.mjs";

const SRC = { id: "setlistfm-pj", label: "Setlist.fm", group: "turne" };

// Fixture baseado na estrutura real da API (show do PJ com set principal + bis).
function show(eventDate, extra = {}) {
  return {
    id: "abc123",
    eventDate,
    url: "https://www.setlist.fm/setlist/pearl-jam/2026/arena-x.html",
    tour: { name: "Test Tour" },
    venue: { name: "Arena X", city: { name: "Lisboa", state: "", country: { name: "Portugal" } } },
    sets: {
      set: [
        { song: [{ name: "Release", tape: true }, { name: "Alive" }, { name: "Baba O'Riley", cover: { name: "The Who" } }] },
        { encore: 1, song: [{ name: "Yellow Ledbetter", info: "Eddie solo" }] },
      ],
    },
    ...extra,
  };
}

describe("parseSetlistDate", () => {
  test("converte DD-MM-YYYY pra Date UTC", () => {
    const d = parseSetlistDate("18-05-2025");
    assert.equal(d.getUTCFullYear(), 2025);
    assert.equal(d.getUTCMonth(), 4); // maio = 4
    assert.equal(d.getUTCDate(), 18);
  });
  test("retorna null pra entrada invalida", () => {
    assert.equal(parseSetlistDate(""), null);
    assert.equal(parseSetlistDate(null), null);
    assert.equal(parseSetlistDate("xx-yy-zzzz"), null);
  });
});

describe("formatSetlistText", () => {
  const txt = formatSetlistText(show("20-05-2026"));
  test("inclui venue, local e turne", () => {
    assert.match(txt, /Arena X/);
    assert.match(txt, /Lisboa, Portugal/);
    assert.match(txt, /Turne: Test Tour/);
  });
  test("lista musicas, marca bis, fita e cover", () => {
    assert.match(txt, /Show principal:/);
    assert.match(txt, /Bis 1:/);
    assert.match(txt, /Alive/);
    assert.match(txt, /fita\/intro/);
    assert.match(txt, /cover de The Who/);
    assert.match(txt, /Eddie solo/);
  });
  test("conta o total de musicas e cita a fonte (atribuicao)", () => {
    assert.match(txt, /Total: 4 musica/);
    assert.match(txt, /Fonte: setlist\.fm/);
  });
});

describe("selectRecentSetlists", () => {
  const now = Date.UTC(2026, 5, 2); // 2 jun 2026
  test("mantem shows recentes, descarta antigos", () => {
    const items = selectRecentSetlists([show("20-05-2026"), show("18-05-2024")], SRC, { now });
    assert.equal(items.length, 1);
    assert.match(items[0].title, /Pearl Jam ao vivo: Arena X, Lisboa, Portugal/);
  });
  test("descarta show sem musica registrada", () => {
    const vazio = show("20-05-2026", { sets: { set: [] } });
    const items = selectRecentSetlists([vazio], SRC, { now });
    assert.equal(items.length, 0);
  });
  test("item sai no formato do pipeline (kind, preText, alwaysRelevant)", () => {
    const [it] = selectRecentSetlists([show("20-05-2026")], SRC, { now });
    assert.equal(it.kind, "setlistfm");
    assert.equal(it.alwaysRelevant, true);
    assert.equal(it.group, "turne");
    assert.ok(it.preText.length > 50);
    assert.ok(it.link.startsWith("https://www.setlist.fm/"));
    assert.equal(it.preImg, null);
  });
});
