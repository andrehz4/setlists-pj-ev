// Scraping HTML do artigo: extrai OG image (com fallback cascata) e texto do artigo (resumo).
// Usa got pra fetch e cheerio pra parse.

import got from "got";
import * as cheerio from "cheerio";

const UA = "setlists-pj-news-bot/1.0 (+https://setlists-pj-ev.pages.dev)";
const TIMEOUT_MS = 15000;
const MAX_HTML_KB = 1500; // cap pra nao alocar HTML monstro

export async function fetchHtml(url) {
  const res = await got(url, {
    headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml" },
    timeout: { request: TIMEOUT_MS },
    retry: { limit: 1 },
    followRedirect: true,
  });
  let html = res.body || "";
  if (html.length > MAX_HTML_KB * 1024) html = html.slice(0, MAX_HTML_KB * 1024);
  return html;
}

export function extractMeta(html, baseUrl) {
  const $ = cheerio.load(html);

  // OG image cascata
  const ogImg =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="og:image"]').attr("content") ||
    $('meta[property="og:image:url"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    $('meta[name="twitter:image:src"]').attr("content") ||
    $('article img').first().attr("src") ||
    $('img').first().attr("src") ||
    null;

  // texto do artigo: tenta seletor canonico, depois <article>, depois primeiros <p>
  let articleText = "";
  const selectors = [
    "article",
    '[itemprop="articleBody"]',
    ".entry-content",
    ".post-content",
    ".article-content",
    "main",
  ];
  for (const sel of selectors) {
    const block = $(sel).first();
    if (block.length) {
      articleText = block
        .find("p")
        .map((_, p) => $(p).text().trim())
        .get()
        .filter((s) => s.length > 30)
        .slice(0, 12)
        .join("\n\n");
      if (articleText.length > 300) break;
    }
  }
  if (!articleText || articleText.length < 200) {
    // fallback: todos os <p> da pagina
    articleText = $("p")
      .map((_, p) => $(p).text().trim())
      .get()
      .filter((s) => s.length > 40)
      .slice(0, 10)
      .join("\n\n");
  }
  // cap a 8kB: precisamos do artigo completo pra traducao integral em PT
  if (articleText.length > 8000) articleText = articleText.slice(0, 8000) + "…";

  // normaliza URL da imagem (relativa → absoluta)
  let imgUrl = null;
  if (ogImg) {
    try {
      imgUrl = new URL(ogImg, baseUrl).toString();
    } catch {
      imgUrl = null;
    }
  }

  return { imgUrl, articleText };
}

export async function scrapeArticle(url) {
  try {
    const html = await fetchHtml(url);
    return extractMeta(html, url);
  } catch (e) {
    console.warn(`[extract] falha em ${url}: ${e.message}`);
    return { imgUrl: null, articleText: "" };
  }
}
