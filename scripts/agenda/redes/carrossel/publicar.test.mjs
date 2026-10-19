// Publicação do carrossel marcado contra o mock do IG (mock-ig/): cada slide leva as próprias marcações.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pastaTemp } from "../../../lib/pasta-temp.mjs";

// O endereço da API é lido quando o módulo carrega: tem que apontar pro mock ANTES de qualquer import, senão o
// teste fala com o Instagram de verdade.
const PORTA = 47000 + Math.floor(Math.random() * 900);
process.env.IG_API_BASE = `http://127.0.0.1:${PORTA}`;
process.env.MOCK_IG_STORE = path.join(pastaTemp("smufdpj-teste-"), `mock-ig-carrossel-${Date.now()}.json`);
const { server, start } = await import("../../../../mock-ig/server.mjs");
const { publishTaggedCarousel } = await import("../../../publish/ig/carrossel-marcado.mjs");

before(async () => { await start(PORTA); });
after(() => server.close());

test("carrossel publica com a banda marcada no slide dela", async () => {
  const slides = [
    { imageUrl: "http://x/capa.jpg", contas: ["blackcirclepj", "pjnoventa"] },
    { imageUrl: "http://x/banda.jpg", contas: ["pjnoventa", "pradocraftbeer"] },
    { imageUrl: "http://x/chamada.jpg", contas: [] },
  ];
  const r = await publishTaggedCarousel(slides, "legenda", { igUserId: "u", accessToken: "t" });
  assert.ok(r.postId);
  assert.equal(r.marcou, true);
  const store = JSON.parse(fs.readFileSync(process.env.MOCK_IG_STORE, "utf8"));
  const itens = Object.values(store.containers).filter((c) => c.image_url);
  const tags = (url) => (itens.find((c) => c.image_url === url).user_tags || []).map((t) => t.username);
  assert.deepEqual(tags("http://x/banda.jpg"), ["pjnoventa", "pradocraftbeer"]);
  assert.deepEqual(tags("http://x/chamada.jpg"), []);
  assert.equal(store.feed[0].slides.length, 3);
});
