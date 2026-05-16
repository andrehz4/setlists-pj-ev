// Quando a imagem cacheada da materia vem cortada no rosto (og:image
// / thumbnail ruim, rosto colado no topo), raspa a pagina do artigo
// atras de uma foto melhor: uma onde o blazeface ache um rosto COM
// headroom (nao colado no topo) e resolucao decente.
//
// So e chamado quando o slide-image detecta topCut na imagem
// primaria, entao o custo (scrape + blazeface nos candidatos) so
// acontece nesses casos, nao em todo post.

import got from "got";
import * as cheerio from "cheerio";
import sharp from "sharp";
import { fetchHtml } from "../news/extract.mjs";
import { detectFaces } from "./face-crop.mjs";

const UA = "setlists-pj-news-bot/1.0 (+https://setlists-pj-ev.pages.dev)";
const MAX_CANDIDATES = 5;     // limita scrape+deteccao por materia
const MIN_WIDTH = 900;        // candidato pequeno demais nao serve

// Heuristica de lixo: logo, sprite, avatar, icone, pixel de tracking.
const JUNK_RX = /(sprite|logo|favicon|avatar|icon|placeholder|1x1|pixel|spacer|blank|loading|default)/i;
const IMG_EXT_RX = /\.(jpe?g|png|webp)(\?|#|$)/i;

function absUrl(src, base) {
  try { return new URL(src, base).toString(); } catch { return null; }
}

// Coleta candidatos de imagem da pagina, em ordem de preferencia:
// og/twitter, JSON-LD, depois <figure>/<article> imgs grandes.
export function extractCandidates(html, baseUrl) {
  const $ = cheerio.load(html);
  const out = [];
  const push = (u) => {
    const abs = u && absUrl(u.trim(), baseUrl);
    if (abs && !out.includes(abs)) out.push(abs);
  };

  push($('meta[property="og:image:secure_url"]').attr("content"));
  push($('meta[property="og:image:url"]').attr("content"));
  push($('meta[property="og:image"]').attr("content"));
  push($('meta[name="og:image"]').attr("content"));
  push($('meta[name="twitter:image"]').attr("content"));
  push($('meta[name="twitter:image:src"]').attr("content"));

  // JSON-LD image (string, array ou {url})
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const j = JSON.parse($(el).contents().text());
      const arr = Array.isArray(j) ? j : [j];
      for (const node of arr) {
        const im = node && node.image;
        if (!im) continue;
        if (typeof im === "string") push(im);
        else if (Array.isArray(im)) im.forEach((x) => push(typeof x === "string" ? x : x?.url));
        else if (im.url) push(im.url);
      }
    } catch {}
  });

  // imagens do corpo do artigo (srcset pega a maior variante)
  $("article img, figure img, .entry-content img, .post-content img, main img").each((_, el) => {
    const $el = $(el);
    const ss = $el.attr("srcset");
    if (ss) {
      const last = ss.split(",").map((s) => s.trim().split(/\s+/)[0]).filter(Boolean).pop();
      push(last);
    }
    push($el.attr("src") || $el.attr("data-src"));
  });

  return out.filter((u) => !JUNK_RX.test(u) && (IMG_EXT_RX.test(u) || /\/(media|wp-content|images?|uploads)\//i.test(u)));
}

async function downloadImage(url) {
  try {
    const buf = await got(url, {
      headers: { "User-Agent": UA },
      timeout: { request: 15000 },
      retry: { limit: 1 },
      responseType: "buffer",
    }).buffer();
    if (!buf || buf.length < 2048) return null;
    return buf;
  } catch {
    return null;
  }
}

// Pontua um buffer: queremos rosto COM headroom e boa resolucao.
//   sem rosto              -> 0  (nao melhora um story de pessoa)
//   rosto mas topCut       -> 1  (mesmo problema da origem)
//   rosto com headroom     -> 100 + bonus de resolucao/headroom
function scoreBuffer(meta, det) {
  if (!meta || (meta.width || 0) < MIN_WIDTH) return -1;
  if (!det || !det.faces || det.faces.length === 0) return 0;
  if (det.topCut) return 1;
  const topRatio = Math.min(...det.faces.map((f) => f.y1)) / det.H;
  if (topRatio < 0.05) return 1; // praticamente colado no topo
  const resBonus = Math.min(30, Math.round((meta.width || 0) / 100));
  const headBonus = Math.round(Math.min(topRatio, 0.4) * 100);
  return 100 + resBonus + headBonus;
}

// Tenta achar uma imagem melhor que a original cortada.
// Retorna { buffer, url } ou null. Best-effort: qualquer erro -> null.
export async function findBetterImage(articleUrl) {
  if (!articleUrl || !/^https?:\/\//.test(articleUrl)) return null;
  let html;
  try {
    html = await fetchHtml(articleUrl);
  } catch {
    return null;
  }
  const candidates = extractCandidates(html, articleUrl).slice(0, MAX_CANDIDATES);
  if (candidates.length === 0) return null;

  let best = null;
  let bestScore = 1; // precisa ser estritamente melhor que "rosto cortado"
  for (const url of candidates) {
    const buf = await downloadImage(url);
    if (!buf) continue;
    let meta;
    try { meta = await sharp(buf, { failOn: "none" }).metadata(); } catch { continue; }
    const det = await detectFaces(buf);
    const score = scoreBuffer(meta, det);
    if (score > bestScore) {
      bestScore = score;
      best = { buffer: buf, url };
    }
  }
  return best;
}
