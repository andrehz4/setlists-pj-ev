// Monta o CARROSSEL completo de cada rascunho (capa -> slides de citação -> CTA)
// e gera um preview HTML mostrando a sequência de slides como no feed do IG.
//
// Uso: node scripts/news/youtube/carrossel-preview.mjs

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = new URL("../../..", import.meta.url).pathname;
const sharp = (await import(`${ROOT}node_modules/sharp/lib/index.js`)).default;
const { buildCoverSlide, buildQuoteSlide, buildCtaSlide } = await import(`${ROOT}scripts/publish/slide-image.mjs`);
const { CYCLE_COLORS } = await import(`${ROOT}scripts/publish/color-cycle.mjs`);

const rasc = JSON.parse(fs.readFileSync(path.join(ROOT, "media/news/youtube-acervo/_rascunhos.json"), "utf8"));
const SLIDES = path.join(ROOT, "media/news/instagram-slides");

async function uri(p) {
  const buf = await sharp(p).resize(360, null).jpeg({ quality: 78 }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

const blocks = [];
for (let ci = 0; ci < rasc.length; ci++) {
  const r = rasc[ci];
  // cor do ciclo por cápsula (na demo, roda a paleta começando no vermelho pra mostrar cor)
  const cor = CYCLE_COLORS[(ci + 1) % CYCLE_COLORS.length];
  const slides = [];
  // 1. capa
  const capaId = `_cx-${r.id}-capa`;
  await buildCoverSlide({ id: capaId, title_pt: r.title_capa || r.title_pt, img: r.img, tags: r.tags, url: "" }, capaId, cor);
  slides.push({ tipo: "capa", uri: await uri(path.join(SLIDES, `${capaId}.jpg`)) });
  fs.rmSync(path.join(SLIDES, `${capaId}.jpg`), { force: true });
  // 2. citações
  const cs = Array.isArray(r.carrossel) ? r.carrossel : [];
  for (let i = 0; i < cs.length; i++) {
    const qId = `_cx-${r.id}-q${i}`;
    await buildQuoteSlide({ id: qId, quote: cs[i].texto, author: cs[i].autor || "Eddie Vedder" }, qId, cor);
    slides.push({ tipo: "citação", uri: await uri(path.join(SLIDES, `${qId}.jpg`)) });
    fs.rmSync(path.join(SLIDES, `${qId}.jpg`), { force: true });
  }
  // 3. CTA
  const ctaId = `_cx-${r.id}-cta`;
  await buildCtaSlide({ hook: "o maior acervo de Pearl Jam do Brasil" }, ctaId, cor);
  slides.push({ tipo: "CTA", uri: await uri(path.join(SLIDES, `${ctaId}.jpg`)) });
  fs.rmSync(path.join(SLIDES, `${ctaId}.jpg`), { force: true });

  const strip = slides.map((s, i) => `<figure><img src="${s.uri}"><figcaption>${i + 1}. ${s.tipo}</figcaption></figure>`).join("");
  blocks.push(`<section><h2>${r.title_pt.replace(/</g, "&lt;")}</h2><div class="strip">${strip}</div></section>`);
  console.log(`carrossel ${r.id}: ${slides.length} slides`);
}

const html = `<!doctype html><meta charset="utf8"><title>Carrossel das cápsulas</title>
<style>body{background:#0f1115;color:#e8e6e0;font-family:system-ui,sans-serif;margin:0;padding:24px}
h1{font-size:20px}h2{font-size:16px;color:#c9cdd4;margin:28px 0 12px}
.strip{display:flex;gap:12px;overflow-x:auto;padding-bottom:12px}
figure{margin:0;flex:0 0 auto}figure img{width:270px;border-radius:8px;display:block;border:1px solid #262b35}
figcaption{font-size:11px;color:#8b93a0;margin-top:6px;text-align:center;text-transform:uppercase;letter-spacing:.08em}</style>
<h1>Carrossel das cápsulas · sequência de slides (arraste →)</h1>
${blocks.join("")}`;
fs.writeFileSync("/tmp/yt-carrossel.html", html);
console.log(`\npreview: /tmp/yt-carrossel.html`);
try { spawnSync("open", ["/tmp/yt-carrossel.html"]); } catch {}
