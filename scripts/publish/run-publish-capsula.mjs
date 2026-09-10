// Publica UMA cápsula do YouTube por run (agendada 1/dia às 20h BRT): gera o
// carrossel (capa -> citações -> CTA, com cor do ciclo), commita os slides,
// publica no IG + FB com a matéria completa na legenda, entra no site (index +
// item + stub) e marca postado. Idempotente via _capsula-queue.json.
//
// Uso local (contra mock): node mock-ig/run.mjs capsula  (ver run.mjs)
//   node scripts/publish/run-publish-capsula.mjs --dry-run
//   node scripts/publish/run-publish-capsula.mjs --force   (ignora agenda)

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { buildCoverSlide, buildQuoteSlide, buildCtaSlide } from "./slide-image.mjs";
import { publishCarouselFromUrls } from "./instagram.mjs";
import { publishAlbumFromUrls } from "./facebook.mjs";
import { CYCLE_COLORS } from "./color-cycle.mjs";

const DRY = process.argv.includes("--dry-run");
const NO_GIT = process.argv.includes("--no-git");
const FORCE = process.argv.includes("--force");
const PUBLISH_FB = process.env.PUBLISH_FB === "1";
const REPO_PUBLIC_BASE = process.env.REPO_PUBLIC_BASE
  || "https://raw.githubusercontent.com/andrehz4/setlists-pj-ev/main";

const ACERVO = path.resolve("media/news/youtube-acervo");
const RASCUNHOS = path.join(ACERVO, "_rascunhos.json");
const QUEUE = path.join(ACERVO, "_capsula-queue.json");
const SLIDES_DIR = path.resolve("media/news/instagram-slides");
const IMG_DIR = path.resolve("media/news/img");
const ITEMS_DIR = path.resolve("media/news/items");
const INDEX = path.resolve("media/news/index.json");

const HASHTAGS_FIXED = ["pearljam", "eddievedder", "pjbrasil", "grunge", "smufdpj"];
const SITE_URL = "setlists-pj-ev.pages.dev";
const SOCIAL_LINE = "siga @smufdpj no Instagram e no Facebook";
const IG_CAPTION_MAX = 2200;

/* ---------- git ---------- */
function git(args) { const r = spawnSync("git", args, { encoding: "utf8" }); if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`); return r.stdout; }
function gitTry(args) { const r = spawnSync("git", args, { encoding: "utf8" }); return { ok: r.status === 0, err: r.stderr || r.stdout }; }
async function commitAndPush(paths, message, retries = 3) {
  if (NO_GIT || DRY) { console.log(`[git] skip (dry/no-git): ${message}`); return; }
  spawnSync("git", ["config", "user.name", process.env.GIT_AUTHOR_NAME || "pj-news-bot"], { encoding: "utf8" });
  spawnSync("git", ["config", "user.email", process.env.GIT_AUTHOR_EMAIL || "bot@setlists-pj.local"], { encoding: "utf8" });
  for (const p of paths) spawnSync("git", ["add", p], { encoding: "utf8" });
  if (spawnSync("git", ["diff", "--cached", "--quiet"], { encoding: "utf8" }).status === 0) { console.log(`[git] nada pra commitar: ${message}`); return; }
  git(["commit", "-m", message]);
  for (let i = 0; i < retries; i++) {
    const pull = gitTry(["pull", "--rebase", "--autostash"]);
    if (!pull.ok) console.warn(`[git] pull warn: ${pull.err}`);
    if (gitTry(["push"]).ok) { console.log(`[git] push OK (try ${i + 1}): ${message}`); return; }
    await new Promise((r) => setTimeout(r, 2000 + i * 1000));
  }
  throw new Error(`git push falhou apos ${retries} tentativas`);
}

/* ---------- helpers ---------- */
function dedupeTags(list) {
  const seen = new Set(), out = [];
  for (const t of list) { const n = String(t || "").toLowerCase().replace(/[^a-z0-9]/g, ""); if (n && !seen.has(n)) { seen.add(n); out.push(n); } }
  return out;
}
function truncar(txt, max) {
  if (!txt || txt.length <= max) return txt || "";
  const corte = txt.slice(0, max);
  const p = Math.max(corte.lastIndexOf(". "), corte.lastIndexOf("? "), corte.lastIndexOf("! "));
  return (p > max * 0.5 ? corte.slice(0, p + 1) : corte.trim()) + "…";
}
// Legenda = matéria completa (cabendo em 2200): título + intro + corpo + assinatura + hashtags.
function buildCaption(cap) {
  const hashtags = dedupeTags([...HASHTAGS_FIXED, ...(cap.tags || [])]).map((t) => `#${t}`).join(" ");
  const tail = `\n\n${SOCIAL_LINE}\nmatéria completa em ${SITE_URL}\n\n${hashtags}`;
  const head = `${cap.title_pt}\n\n${cap.intro_pt}`;
  const budget = IG_CAPTION_MAX - tail.length - head.length - 6;
  let caption = head;
  if (cap.body_pt && budget > 120) caption += `\n\n${truncar(cap.body_pt, budget)}`;
  return caption + tail;
}

function loadQueue(rasc) {
  if (fs.existsSync(QUEUE)) return JSON.parse(fs.readFileSync(QUEUE, "utf8"));
  // primeira vez: agenda 1/dia às 23:00 UTC (20h BRT), a 1ª no dia da estreia
  const base = new Date(); base.setUTCHours(23, 0, 0, 0);
  const q = rasc.map((c, i) => {
    const d = new Date(base); d.setUTCDate(d.getUTCDate() + i);
    return { id: c.id, publishAt: d.toISOString(), postedAt: null };
  });
  fs.writeFileSync(QUEUE, JSON.stringify(q, null, 2));
  console.log(`[capsula] fila criada: ${q.length} cápsulas, 1/dia a partir de ${q[0].publishAt}`);
  return q;
}

async function gerarSlides(cap, cor, urlBase) {
  fs.mkdirSync(SLIDES_DIR, { recursive: true });
  const urls = [];
  const capaId = `${cap.id}-00`;
  await buildCoverSlide({ id: capaId, title_pt: cap.title_capa || cap.title_pt, img: cap.img, tags: cap.tags, kind: "youtube", url: "" }, capaId, cor);
  urls.push(`${urlBase}/${capaId}.jpg`);
  const cs = Array.isArray(cap.carrossel) ? cap.carrossel : [];
  for (let i = 0; i < cs.length; i++) {
    const qId = `${cap.id}-${String(i + 1).padStart(2, "0")}`;
    await buildQuoteSlide({ id: qId, quote: cs[i].texto, author: cs[i].autor || "Eddie Vedder" }, qId, cor);
    urls.push(`${urlBase}/${qId}.jpg`);
  }
  const ctaId = `${cap.id}-99`;
  await buildCtaSlide({ hook: "o maior acervo de Pearl Jam do Brasil" }, ctaId, cor);
  urls.push(`${urlBase}/${ctaId}.jpg`);
  // capa também vira a imagem do site
  fs.mkdirSync(IMG_DIR, { recursive: true });
  fs.copyFileSync(path.join(SLIDES_DIR, `${capaId}.jpg`), path.join(IMG_DIR, `${cap.id}.jpg`));
  return urls;
}

function entrarNoSite(cap, nowIso) {
  const idx = JSON.parse(fs.readFileSync(INDEX, "utf8"));
  const items = Array.isArray(idx.items) ? idx.items : idx;
  if (items.find((it) => it.id === cap.id)) return; // já está
  items.unshift({
    id: cap.id, url: `https://youtu.be/${cap.videoId}`, source: "youtube", sourceLabel: "Cápsula",
    group: "capsula", pubDate: nowIso, fetchedAt: nowIso, img: `/media/news/img/${cap.id}.jpg`,
    title_pt: cap.title_pt, intro_pt: cap.intro_pt, tags: cap.tags || [], title_ig: cap.title_capa || cap.title_pt,
  });
  fs.writeFileSync(INDEX, JSON.stringify(idx, null, 2));
  fs.mkdirSync(ITEMS_DIR, { recursive: true });
  fs.writeFileSync(path.join(ITEMS_DIR, `${cap.id}.json`), JSON.stringify({ id: cap.id, body_pt: cap.body_pt }, null, 2));
}

// Espera o raw.githubusercontent propagar o slide antes de publicar (arquivo
// novo pode levar 15-40s; sem isso o IG baixa 404 e recusa com "Only photo or
// video can be accepted"). Faz HEAD na 1a URL até 200.
async function waitForRaw(url, timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try { const r = await fetch(url, { method: "HEAD" }); if (r.ok) return true; } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 3000));
  }
  console.warn(`[capsula] raw não propagou em ${timeoutMs}ms: ${url}`);
  return false;
}

async function telegram(msg) {
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat || DRY) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: msg }),
    });
  } catch (e) { console.warn(`[telegram] ${e.message}`); }
}

async function main() {
  const now = new Date();
  const nowIso = now.toISOString();
  console.log(`[capsula] run ${nowIso} dry=${DRY} no-git=${NO_GIT} force=${FORCE} fb=${PUBLISH_FB}`);

  const rasc = JSON.parse(fs.readFileSync(RASCUNHOS, "utf8"));
  const rascById = new Map(rasc.map((c) => [c.id, c]));
  const q = loadQueue(rasc);

  const postados = q.filter((e) => e.postedAt).length;
  const pend = q.filter((e) => !e.postedAt);
  const alvo = FORCE ? pend[0] : pend.find((e) => new Date(e.publishAt) <= now);
  if (!alvo) { console.log(`[capsula] nenhuma cápsula madura (${pend.length} pendentes). skip.`); return; }

  const cap = rascById.get(alvo.id);
  if (!cap) { console.error(`[capsula] rascunho ${alvo.id} não encontrado`); process.exit(1); }
  const cor = CYCLE_COLORS[postados % CYCLE_COLORS.length];
  console.log(`[capsula] publicando ${cap.id}: "${cap.title_capa}" (cor ${cor})`);

  const urlBase = `${REPO_PUBLIC_BASE}/media/news/instagram-slides`;
  const urls = await gerarSlides(cap, cor, urlBase);
  console.log(`[capsula] ${urls.length} slides gerados`);
  const caption = buildCaption(cap);

  await commitAndPush(["media/news/instagram-slides/", "media/news/img/"], `publish-capsula: slides ${cap.id}`);
  if (!DRY) await waitForRaw(urls[0]); // espera o raw propagar (poll até 200)

  if (DRY) { console.log(`[capsula] DRY: ${urls.length} slides, caption ${caption.length} chars, pulando publish`); return; }

  const r = await publishCarouselFromUrls(urls, caption);
  console.log(`[capsula] IG OK postId=${r.postId}${r.recovered ? " (recuperado)" : ""}`);
  let fbPostId = null;
  if (PUBLISH_FB && process.env.FB_PAGE_ID && process.env.FB_PAGE_TOKEN) {
    try { const fb = await publishAlbumFromUrls(urls, caption); fbPostId = fb.postId; console.log(`[capsula] FB OK fbPostId=${fb.postId}`); }
    catch (e) { console.error(`[capsula] FB FALHA (IG ok, seguindo): ${e.toDetailString ? e.toDetailString() : e.message}`); }
  }

  // marca postado + entra no site + commit
  alvo.postedAt = nowIso; alvo.igPostId = r.postId; alvo.fbPostId = fbPostId;
  fs.writeFileSync(QUEUE, JSON.stringify(q, null, 2));
  entrarNoSite(cap, nowIso);
  spawnSync("node", ["scripts/news/build-news-stubs.mjs"], { encoding: "utf8" });
  await commitAndPush(
    ["media/news/index.json", "media/news/items/", "media/news/youtube-acervo/_capsula-queue.json", "n/", "sitemap.xml"],
    `publish-capsula: ${cap.id} postado (IG ${r.postId}${fbPostId ? `, FB ${fbPostId}` : ""})`,
  );
  await telegram(`Cápsula publicada: "${cap.title_capa}"\nIG: ${r.postId}${fbPostId ? `\nFB: ${fbPostId}` : ""}\n${SITE_URL}/#news/${cap.id}`);
  console.log(`[capsula] FIM ${cap.id}`);
}

main().catch((e) => { console.error(`[capsula] FATAL: ${e.stack || e.message}`); process.exit(1); });
