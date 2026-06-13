// Testes do reel semanal: selecao+formatos (reel-select), acervo de clipes
// (reel-clips), plano de cenas e SVGs do MOTION-SPEC (reel-video, parte pura,
// sem ffmpeg), utilitarios de semana (reel-week), caption (instagram) e o
// publishReel ponta a ponta contra o mock.
//
// Rodar: node --test scripts/publish/reel.test.mjs

import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

// store + porta proprios (a suite roda arquivos em paralelo: 8795 livre)
process.env.MOCK_IG_STORE = path.join(os.tmpdir(), `mock-ig-reel-${process.pid}.json`);
const PORT = Number(process.env.MOCK_REEL_PORT || 8795);
const base = `http://127.0.0.1:${PORT}`;
process.env.MOCK_IG_PORT = String(PORT);
process.env.IG_API_BASE = base;
process.env.IG_USER_ID = "u";
process.env.IG_ACCESS_TOKEN = "tok";

const { server, start } = await import("../../mock-ig/server.mjs");
await start(PORT);
after(() => server.close());

const { selectReelItems } = await import("./reel-select.mjs");
const { validateClipEntry, pickClipFor, weekSeed, loadClips } = await import("./reel-clips.mjs");
const { buildScenePlan, wrapWords, coldOpenSvg, kineticSvg, cardSvg, paperSvg, outroSvg, thumbOffsetMsFor, COLD_DUR, BLOCK_DUR, OUTRO_DUR } = await import("./reel-video.mjs");
const { isoWeekKey, weekRangeLabel } = await import("./reel-week.mjs");
const { publishReel, buildReelCaption } = await import("./instagram.mjs");
const { shouldPruneReel, KEEP_DAYS_REELS } = await import("./prune-media.mjs");

// ---------- fixtures ----------

const NOW = Date.parse("2026-06-12T12:00:00Z");
const daysAgo = (n) => new Date(NOW - n * 24 * 60 * 60 * 1000).toISOString();

function fixtureIndex() {
  return {
    items: [
      { id: "aa1", title_pt: "Pearl Jam anuncia turnê no Brasil", tags: ["turne"], fetchedAt: daysAgo(1), img: "/media/news/img/_band-fallback-1.jpg" },
      { id: "bb2", title_pt: "Eddie Vedder toca com convidado", tags: ["eddie"], fetchedAt: daysAgo(2), img: "/media/news/img/_band-fallback-2.jpg" },
      { id: "cc3", title_pt: "Notícia sem foto utilizável", tags: ["mike"], fetchedAt: daysAgo(3) },
      { id: "cd-1", title_pt: "Digest da comunidade", tags: ["comunidade"], kind: "community-digest", fetchedAt: daysAgo(2), img: "/media/news/img/_band-fallback-3.jpg" },
      { id: "cd-2", title_pt: "Outro digest", tags: ["comunidade"], kind: "community-digest", fetchedAt: daysAgo(4), img: "/media/news/img/_band-fallback-4.jpg" },
      { id: "cd-3", title_pt: "Terceiro digest (deve ser capado)", tags: ["comunidade"], kind: "community-digest", fetchedAt: daysAgo(5), img: "/media/news/img/_band-fallback-1.jpg" },
      { id: "dd4", title_pt: "Matéria velha fora da janela", tags: ["memoria"], fetchedAt: daysAgo(9), img: "/media/news/img/_band-fallback-2.jpg" },
    ],
  };
}

async function writeFixtureIndex() {
  const p = path.join(os.tmpdir(), `reel-index-${process.pid}.json`);
  await fs.writeFile(p, JSON.stringify(fixtureIndex()));
  return p;
}

// ---------- reel-select ----------

test("reel-select: janela de 7d, cap de 2 comunidade, formatos do design", async () => {
  const indexPath = await writeFixtureIndex();
  const items = await selectReelItems({ now: NOW, indexPath });
  const ids = items.map((it) => it.id);

  assert.ok(!ids.includes("dd4"), "item fora da janela de 7d nao entra");
  assert.ok(!ids.includes("cd-3"), "terceiro digest capado (max 2 papel)");
  assert.equal(items[0].format, "kinetic", "abre com bloco cinetico");
  assert.equal(items[0].id, "aa1", "abertura e a manchete forte (tag turne)");
  const cc3 = items.find((it) => it.id === "cc3");
  assert.equal(cc3.format, "kinetic", "item sem foto vira cinetico");
  assert.equal(cc3.hasImg, false);
  for (const it of items.filter((i) => i.kind === "community-digest")) {
    assert.equal(it.format, "paper", "digest vira papel");
  }
  // sem formato igual adjacente (cards intercalam os especiais)
  for (let i = 1; i < items.length; i++) {
    if (items[i].format !== "card") {
      assert.notEqual(items[i].format, items[i - 1].format, `formatos adjacentes iguais em ${i}`);
    }
  }
});

test("reel-select: menos que o minimo devolve vazio", async () => {
  const p = path.join(os.tmpdir(), `reel-index-min-${process.pid}.json`);
  await fs.writeFile(p, JSON.stringify({ items: fixtureIndex().items.slice(0, 2) }));
  const items = await selectReelItems({ now: NOW, indexPath: p });
  assert.equal(items.length, 0);
});

// ---------- reel-clips ----------

test("reel-clips: validacao de entrada", () => {
  assert.equal(validateClipEntry({ file: "a.mp4", tags: ["eddie"] }), null);
  assert.match(validateClipEntry({ file: "a.mov", tags: ["x"] }), /mp4/);
  assert.match(validateClipEntry({ file: "../a.mp4", tags: ["x"] }), /nome simples/);
  assert.match(validateClipEntry({ file: "a.mp4", tags: [] }), /tags/);
  assert.match(validateClipEntry({ tags: ["x"] }), /file/);
});

test("reel-clips: pickClipFor prioriza tag e nao repete; deterministico por seed", () => {
  const clips = [
    { file: "eddie-1.mp4", tags: ["eddie"], path: "/x/eddie-1.mp4" },
    { file: "eddie-2.mp4", tags: ["eddie"], path: "/x/eddie-2.mp4" },
    { file: "geral-1.mp4", tags: ["memoria"], path: "/x/geral-1.mp4" },
  ];
  const item = { id: "i1", tags: ["eddie"] };
  const seed = weekSeed("2026-W24");

  const used1 = new Set();
  const c1 = pickClipFor(item, clips, { used: used1, seed, slot: 0 });
  const c2 = pickClipFor(item, clips, { used: used1, seed, slot: 1 });
  assert.ok(c1.tags.includes("eddie") && c2.tags.includes("eddie"));
  assert.notEqual(c1.file, c2.file, "nao repete clipe no mesmo reel");

  const used2 = new Set();
  const c1b = pickClipFor(item, clips, { used: used2, seed, slot: 0 });
  assert.equal(c1.file, c1b.file, "mesma semana escolhe igual (deterministico)");

  const seedOther = weekSeed("2026-W25");
  const used3 = new Set();
  const c1c = pickClipFor(item, clips, { used: used3, seed: seedOther, slot: 0 });
  assert.ok(c1c, "outra semana tambem escolhe (rotacao)");
});

test("reel-clips: loadClips ignora entrada sem arquivo no disco", async () => {
  const dir = path.join(os.tmpdir(), `reel-clips-${process.pid}`);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "clips.json"), JSON.stringify({
    clips: [{ file: "fantasma.mp4", tags: ["eddie"] }],
  }));
  const clips = await loadClips({ dir });
  assert.equal(clips.length, 0);
});

// ---------- reel-video (parte pura) ----------

test("reel-video: plano de cenas bate com o MOTION-SPEC (8 blocos = 41.5s)", () => {
  const items = Array.from({ length: 8 }, (_, i) => ({ id: `i${i}`, format: i % 2 ? "card" : "kinetic", title_pt: "x" }));
  const { scenes, totalS, totalFrames } = buildScenePlan(items);
  assert.equal(scenes.length, 10);
  assert.equal(totalS, COLD_DUR + 8 * BLOCK_DUR + OUTRO_DUR);
  assert.equal(totalS, 41.5);
  assert.equal(totalFrames, 1245);
  assert.equal(scenes[1].start, 3.0);
  assert.equal(scenes[9].kind, "outro");
  assert.equal(thumbOffsetMsFor(), 5500, "capa no 1o bloco com manchete montada");
});

test("reel-video: wrapWords respeita largura e preserva palavras", () => {
  const lines = wrapWords("Jeff Ament revela novo baterista do PJ", 112, 920);
  assert.ok(lines.length >= 2);
  const all = lines.flat().map((w) => w.text).join(" ");
  assert.equal(all, "JEFF AMENT REVELA NOVO BATERISTA DO PJ");
  for (const line of lines) {
    const last = line[line.length - 1];
    assert.ok(last.x + last.w <= 920 + 1, "linha dentro da largura maxima");
  }
});

test("reel-video: SVGs das 5 cenas renderizam conteudo esperado", () => {
  const item = { id: "i1", title_pt: "Pearl Jam anuncia turnê", tags: ["turne"] };
  const cold = coldOpenSvg(2.5, { accent: "#E10600", itemCount: 8, rangeLabel: "06 A 12 JUN" });
  assert.ok(cold.includes("AS NOTÍCIAS DA SEMANA") && cold.includes("08 MANCHETES"));
  assert.ok(cold.includes(">S<") || /font-size="230"/.test(cold), "letras SMUFDPJ presentes");

  const kin = kineticSvg(3.0, { item, n: 1, total: 8, accent: "#E10600" });
  assert.ok(kin.includes("TURNÊ") && kin.includes("PEARL"));
  const ghost = kineticSvg(3.0, { item, n: 1, total: 8, accent: "#E10600", ghost: true });
  assert.ok(ghost.includes("CLIPE") && ghost.includes("#0d0c0b"));

  const card = cardSvg(2.0, { item, n: 2, total: 8, accent: "#E10600" });
  assert.ok(card.includes("LEIA MAIS") && card.includes("setlists-pj-ev.pages.dev") && card.includes("card-grad"));

  const paper = paperSvg(2.0, { item: { ...item, tags: ["comunidade"] }, n: 3, total: 8, accent: "#E10600" });
  assert.ok(paper.includes("#ede4cc") && paper.includes("comunidade global"));

  const outro = outroSvg(2.0, { accent: "#E10600" });
  assert.ok(outro.includes("SIGA") && outro.includes("@smufdpj"));

  // frame 0 nao explode e e SVG valido
  for (const svg of [cold, kin, card, paper, outro]) {
    assert.ok(svg.trim().startsWith("<svg"));
  }
});

// ---------- reel-week ----------

test("reel-week: chave ISO e rotulo do intervalo", () => {
  assert.equal(isoWeekKey(new Date("2026-06-12T09:00:00Z")), "2026-W24");
  assert.equal(isoWeekKey(new Date("2026-01-01T09:00:00Z")), "2026-W01");
  assert.equal(weekRangeLabel(new Date("2026-06-12T09:00:00Z")), "06 A 12 JUN");
  assert.equal(weekRangeLabel(new Date("2026-06-03T09:00:00Z")), "28 MAI A 03 JUN");
});

// ---------- poda ----------

test("shouldPruneReel: apaga MP4 de semana velha, preserva recente e nome fora do padrao", () => {
  const now = Date.parse("2026-06-13T00:00:00Z");
  // W24 termina ~14/06; com 30d de folga so poda bem depois
  assert.equal(shouldPruneReel("2026-W24.mp4", now), false, "semana atual preservada");
  assert.equal(shouldPruneReel("2026-W14.mp4", now), true, "semana de ~10 semanas atras podada");
  assert.equal(shouldPruneReel("2026-W24.mp4", now + KEEP_DAYS_REELS * 864e5 + 8 * 864e5), true);
  assert.equal(shouldPruneReel("_reel-log.json", now), false, "nao-mp4 preservado");
  assert.equal(shouldPruneReel("2026-06-13.mp4", now), false, "formato de story (data) nao casa reel");
});

// ---------- caption ----------

test("buildReelCaption: indice numerado + CTA + hashtags, sob o limite", () => {
  const items = [
    { title_pt: "Primeira manchete", tags: ["eddie"] },
    { title_pt: "Segunda manchete", tags: ["turne"] },
    { title_pt: "Terceira manchete", tags: [] },
  ];
  const cap = buildReelCaption(items, { weekLabel: "06 A 12 JUN" });
  assert.ok(cap.startsWith("RESUMÃO DA SEMANA · 06 A 12 JUN"));
  assert.ok(cap.includes("1. Primeira manchete") && cap.includes("3. Terceira manchete"));
  assert.ok(cap.includes("leia completo em setlists-pj-ev.pages.dev"));
  assert.ok(cap.includes("#pearljam") && cap.includes("#eddie") && cap.includes("#turne"));
  assert.ok(cap.length <= 2200);
});

// ---------- publishReel contra o mock ----------

const form = (obj) => new URLSearchParams(obj).toString();
async function postMock(p, body) {
  const r = await fetch(base + p, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form(body) });
  return { status: r.status, body: await r.json() };
}

test("publishReel: container REELS -> poll -> publish no mock", async () => {
  await postMock("/_mock/reset", {});
  const r = await publishReel({
    videoUrl: "http://fake-host/reel.mp4",
    caption: "reel de teste do resumao",
    thumbOffsetMs: 5500,
  });
  assert.ok(r.postId, "postId presente");
  const reels = await (await fetch(`${base}/_mock/reels`)).json();
  assert.equal(reels.length, 1);
  assert.equal(reels[0].postId, r.postId);
  assert.equal(reels[0].caption, "reel de teste do resumao");
});

test("publishReel: recupera falso-erro 2207051 pelo caption (ghostpublish)", async () => {
  await postMock("/_mock/reset", {});
  await postMock("/_mock/fail", { fail: "ghostpublish" });
  const caption = "reel ghost com caption longa o suficiente pra bater o prefixo de sessenta caracteres do matcher";
  const r = await publishReel({ videoUrl: "http://fake-host/reel.mp4", caption });
  assert.ok(r.recovered, "tratou como falso-erro e recuperou o post");
  assert.ok(r.postId);
  await postMock("/_mock/fail", { fail: "none" });
});

test("publishReel: poll aguarda processamento do video (storyPolls > 0)", async () => {
  await postMock("/_mock/reset", {});
  await postMock("/_mock/fail", { fail: "none", storyPolls: "2" });
  const r = await publishReel({ videoUrl: "http://fake-host/reel.mp4", caption: "reel com processamento" });
  assert.ok(r.postId);
  await postMock("/_mock/fail", { fail: "none", storyPolls: "0" });
});
