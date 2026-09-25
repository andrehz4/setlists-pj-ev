// Publica os posts de colaborador aprovados quando chega o horário (:30): Instagram
// (capa SMUFDPJ + fotos da pessoa), Facebook (se PUBLISH_FB=1) e site (index + item + stub).
// Roda no mesmo cron da curadoria (contrib-curadoria.yml). Vídeo vira Reel (publicar-video.mjs).
//
// Contra post duplicado: grava a tentativa no backend ANTES do IG; se uma run anterior
// morreu no meio, procura o post pela legenda no IG antes de postar de novo.
//
// Uso: node scripts/contrib/publicar.mjs [--dry]   |   contra o mock: node mock-ig/run.mjs contrib

// fontconfig-boot ANTES do sharp (side-effect): sem isso a capa sai sem a fonte Anton.
import "../publish/fontconfig-boot.mjs";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
import { buildCoverSlide } from "../publish/slide-image.mjs";
import { publishCarouselFromUrls, recoverPublishedPost } from "../publish/instagram.mjs";
import { publishAlbumFromUrls } from "../publish/facebook.mjs";
import { isCoolingDown, readCooldown } from "../publish/queue.mjs";
import { CYCLE_COLORS } from "../publish/color-cycle.mjs";
import { commitAndPush, esperarRaw } from "./git.mjs";
import { creditoAutor, idSite, itemSite, legendaIG } from "./post.mjs";
import { bot, falhou, telegram } from "./api.mjs";
import { publicarVideo } from "./publicar-video.mjs";

const DRY = process.argv.includes("--dry");
const NO_GIT = DRY || process.argv.includes("--no-git"); // --no-git: publica (mock) sem commitar
const RAW = process.env.REPO_PUBLIC_BASE || "https://raw.githubusercontent.com/andrehz4/setlists-pj-ev/main";
const SLIDES = "media/news/instagram-slides";
const IMG = "media/news/img";
const INDEX = "media/news/index.json";

async function baixar(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download da foto falhou: HTTP ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

// Fotos da pessoa em 4:5 (1080x1350, corte pelo ponto de interesse) + capa com a identidade do site.
async function montarSlides(envio, id) {
  const nomes = [];
  for (const [i, m] of envio.media.entries()) {
    const original = await baixar(m.url);
    // Site e capa recebem a foto INTEIRA (a capa faz o próprio corte); o slide vai em 4:5.
    if (i === 0) await sharp(original).rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 86 }).toFile(path.join(IMG, `${id}.jpg`));
    const buf = await sharp(original).rotate().resize(1080, 1350, { fit: "cover", position: "attention" }).jpeg({ quality: 88 }).toBuffer();
    const nome = `${id}-${String(i + 1).padStart(2, "0")}.jpg`;
    fs.writeFileSync(path.join(SLIDES, nome), buf);
    nomes.push(nome);
  }
  const cor = CYCLE_COLORS[Math.floor(Date.now() / 3600e3) % CYCLE_COLORS.length];
  await buildCoverSlide({ id, url: "", title_pt: envio.title, title_ig: envio.title, img: `/${IMG}/${id}.jpg`, tags: ["comunidade"] }, `${id}-capa`, cor);
  return [`${id}-capa.jpg`, ...nomes].slice(0, 10).map((n) => `${RAW}/${SLIDES}/${n}`);
}

function entrarNoSite(envio, nowIso) {
  const { item, corpo } = itemSite(envio, nowIso);
  const idx = JSON.parse(fs.readFileSync(INDEX, "utf8"));
  const lista = Array.isArray(idx.items) ? idx.items : idx;
  if (!lista.some((it) => it.id === item.id)) lista.unshift(item);
  fs.writeFileSync(INDEX, JSON.stringify(idx, null, 2));
  fs.writeFileSync(path.join("media/news/items", `${item.id}.json`), JSON.stringify(corpo, null, 2));
  spawnSync("node", ["scripts/news/build-news-stubs.mjs"], { encoding: "utf8" });
}

const ehVideo = (envio) => !!envio.video && /\.(mp4|mov)$/i.test(envio.media[0]?.key || "");

// Run anterior morreu depois do IG? Procura o post pela legenda antes de postar de novo.
async function jaPublicado(envio, caption) {
  const antes = envio.publicacao;
  if (!antes?.tentativa_em || antes.caption !== caption) return null;
  return recoverPublishedPost({
    igUserId: process.env.IG_USER_ID, accessToken: process.env.IG_ACCESS_TOKEN,
    caption, sinceMs: new Date(antes.tentativa_em).getTime() - 60000,
  });
}

async function publicarFotos(envio, id, caption) {
  const urls = await montarSlides(envio, id);
  await commitAndPush([SLIDES, IMG], `contrib: slides ${id}`, { dry: NO_GIT });
  if (DRY) return { postId: null, fbPostId: null };
  if (!(await esperarRaw(urls[0]))) throw new Error("slides não apareceram no raw do GitHub a tempo");
  await bot(`/publicando/${envio.id}`, { caption });
  const r = await publishCarouselFromUrls(urls, caption);
  let fbPostId = null;
  if (process.env.PUBLISH_FB === "1" && process.env.FB_PAGE_ID) {
    try { fbPostId = (await publishAlbumFromUrls(urls, caption)).postId; }
    catch (e) { console.error(`[contrib] FB falhou (IG ok, seguindo): ${e.message}`); }
  }
  return { postId: r.postId, fbPostId, recuperado: !!r.recovered };
}

async function publicar(envio) {
  const id = idSite(envio);
  const caption = legendaIG(envio);
  const video = ehVideo(envio);
  let r;
  const achado = await jaPublicado(envio, caption);
  if (achado) {
    if (video) await publicarVideo(envio, id, caption, { dry: true }); // só refaz a miniatura do site
    r = { postId: achado, fbPostId: null, recuperado: true };
  } else {
    r = video ? await publicarVideo(envio, id, caption, { dry: DRY }) : await publicarFotos(envio, id, caption);
  }
  if (DRY) return console.log(`[dry] ${id} (${video ? "reel" : "carrossel"})\n${caption}`);

  entrarNoSite(envio, new Date().toISOString());
  await commitAndPush([INDEX, IMG, "media/news/items/", "n/", "sitemap.xml"], `contrib: ${id} publicado (IG ${r.postId})`, { dry: NO_GIT });
  await bot(`/publicado/${envio.id}`, { site_id: id, ig_post_id: r.postId, fb_post_id: r.fbPostId });
  await telegram(`📣 ${video ? "Reel" : "Post"} de colaborador no ar: "${envio.title}"\npor ${creditoAutor(envio.autor)}${r.recuperado ? " (recuperado)" : ""}\nhttps://setlists-pj-ev.pages.dev/#news/${id}`);
}

async function main() {
  if (!process.env.CONTRIB_BOT_KEY) return console.log("CONTRIB_BOT_KEY ausente: publicação de colaboradores desligada.");
  if (isCoolingDown(await readCooldown(), new Date().toISOString())) return console.log("IG em cooldown global: fica pra próxima rodada.");
  const prontos = await bot("/prontos");
  console.log(`Prontos pra publicar: ${prontos.length}`);
  let falhas = 0;
  for (const envio of prontos) {
    try { await publicar(envio); }
    catch (e) {
      falhas++;
      console.error(`${envio.id} falhou:`, e.message);
      if (e.status !== 409) await falhou(envio, "publicacao", e);
    }
  }
  if (falhas) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
