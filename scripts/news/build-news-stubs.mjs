// Gera paginas estaticas n/<id>.html pra cada noticia do index.json.
//
// Cada pagina tem o texto completo da noticia (modelo em news-page.mjs), sem
// redirect: e ela que o Google indexa. Os links compartilhados (Telegram, bio
// do IG) tambem apontam pra /n/<id>; o botao "Abrir no site" leva pro SPA.
//
// Tambem regenera a secao de noticias do sitemap.xml (entre os marcadores
// <!-- news:start --> e <!-- news:end -->; cria os marcadores se faltarem).
//
// Quem chama: run-publish.mjs no inicio de cada run (so reescreve o que mudou,
// idempotente) e o proprio publish commita n/ + sitemap.xml. Fica fora do
// caminho da routine de curadoria de proposito: o validador do auto-merge
// so aceita paths media/news/, e as paginas ficam na raiz (n/).
//
// CLI (backfill manual): node scripts/news/build-news-stubs.mjs

import fs from "node:fs/promises";
import path from "node:path";
import { SITE_BASE, esc, paginaNoticia, paginaIndiceNoticias, relacionadas } from "./news-page.mjs";

const NEWS_DIR = path.resolve("media/news");
const INDEX_PATH = path.join(NEWS_DIR, "index.json");
const ITEMS_DIR = path.join(NEWS_DIR, "items");
const STUBS_DIR = path.resolve("n");
const SITEMAP_PATH = path.resolve("sitemap.xml");
const INDICE_PATH = path.resolve("noticias/index.html");

async function lerCorpo(id) {
  try {
    return JSON.parse(await fs.readFile(path.join(ITEMS_DIR, `${id}.json`), "utf8")).body_pt || "";
  } catch {
    return ""; // sem corpo, a pagina sai so com titulo e resumo
  }
}

function buildSitemapNewsSection(items) {
  const lines = [`  <url>\n    <loc>${SITE_BASE}/noticias/</loc>\n    <changefreq>daily</changefreq>\n`
    + "    <priority>0.8</priority>\n  </url>"];
  for (const it of items) {
    lines.push("  <url>");
    lines.push(`    <loc>${esc(`${SITE_BASE}/n/${encodeURIComponent(it.id)}`)}</loc>`);
    if (it.pubDate) lines.push(`    <lastmod>${esc(it.pubDate.slice(0, 10))}</lastmod>`);
    lines.push("    <changefreq>monthly</changefreq>");
    lines.push("    <priority>0.6</priority>");
    lines.push("  </url>");
  }
  return lines.join("\n");
}

async function updateSitemap(items) {
  let xml = await fs.readFile(SITEMAP_PATH, "utf8");
  const START = "<!-- news:start -->";
  const END = "<!-- news:end -->";
  const section = `${START}\n${buildSitemapNewsSection(items)}\n${END}`;
  if (xml.includes(START) && xml.includes(END)) {
    xml = xml.replace(new RegExp(`${START}[\\s\\S]*?${END}`), section);
  } else {
    xml = xml.replace("</urlset>", `${section}\n</urlset>`);
  }
  await fs.writeFile(SITEMAP_PATH, xml);
}

// Gera stubs que faltam (ou cujo titulo mudou) + sitemap. Retorna quantos
// stubs foram escritos; 0 = nada mudou, nada a commitar.
export async function buildNewsStubs({ force = false } = {}) {
  let indexDoc;
  try {
    indexDoc = JSON.parse(await fs.readFile(INDEX_PATH, "utf8"));
  } catch {
    return 0; // sem index legivel, nada a fazer (quem valida o index e o publish)
  }
  const items = (indexDoc.items || []).filter((it) => it && it.id && /^[\w-]+$/.test(it.id));
  if (items.length === 0) return 0;
  await fs.mkdir(STUBS_DIR, { recursive: true });
  let written = 0;
  for (const it of items) {
    const p = path.join(STUBS_DIR, `${it.id}.html`);
    const html = paginaNoticia(it, await lerCorpo(it.id), relacionadas(it, items));
    if (!force) {
      try {
        const cur = await fs.readFile(p, "utf8");
        if (cur === html) continue;
      } catch {}
    }
    await fs.writeFile(p, html);
    written++;
  }
  // Índice /noticias/ (todas as notícias por mês): conta como escrita se mudou.
  const indice = paginaIndiceNoticias(items);
  let indiceAtual = null;
  try { indiceAtual = await fs.readFile(INDICE_PATH, "utf8"); } catch {}
  if (indiceAtual !== indice) {
    await fs.mkdir(path.dirname(INDICE_PATH), { recursive: true });
    await fs.writeFile(INDICE_PATH, indice);
    written++;
  }
  if (written > 0) await updateSitemap(items);
  return written;
}

// CLI: backfill manual de todos os stubs.
const isMain = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]));
if (isMain) {
  const n = await buildNewsStubs({ force: process.argv.includes("--force") });
  console.log(`[stubs] ${n} stub(s) escritos em n/ + sitemap.xml atualizado`);
}
