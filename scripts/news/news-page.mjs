// Página estática completa de uma notícia (/n/<id>) e índice /noticias/, pensados pro Google ler.
//
// Antes o /n/<id> era só um stub que redirecionava pra /#news/<id>. O Google ignora
// o que vem depois do "#", então tratava as notícias como redirect pra home e não
// indexava nenhuma. Agora a página tem o texto inteiro, sem redirect, e o link
// "Abrir no site" leva pra versão interativa. Molde comum em scripts/seo/layout.mjs.

import { SITE_BASE, esc } from "../seo/base.mjs";
import { pagina } from "../seo/layout.mjs";

export { SITE_BASE, esc };

// Mesmo formato do site (_newsBodyHtml no index.html): parágrafos por linha em branco, _itálico_.
export function corpoHtml(body) {
  return String(body || "").split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
    .map(p => `<p>${esc(p).replace(/_([^_]+)_/g, "<em>$1</em>").replace(/\*([^*\n]+)\*/g, "<em>$1</em>")}</p>`).join("\n");
}

export function dataExtenso(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
}

const imagemDe = it => (it.img ? `${SITE_BASE}${it.img}` : `${SITE_BASE}/og.jpg`);
const porData = (a, b) => String(b.pubDate || "").localeCompare(String(a.pubDate || ""));

// Até `n` notícias com tag em comum (mais recentes primeiro); completa com as mais recentes.
export function relacionadas(item, todos, n = 4) {
  const tags = new Set(item.tags || []);
  const outros = todos.filter(x => x.id !== item.id);
  const comTag = outros.filter(x => (x.tags || []).some(t => tags.has(t))).sort(porData);
  const escolhidas = comTag.slice(0, n);
  for (const x of [...outros].sort(porData)) {
    if (escolhidas.length >= n) break;
    if (!escolhidas.includes(x)) escolhidas.push(x);
  }
  return escolhidas;
}

export function paginaNoticia(item, body, relacionadasLista = []) {
  const url = `${SITE_BASE}/n/${encodeURIComponent(item.id)}`;
  const titulo = item.title_pt || "Notícia";
  const desc = String(item.intro_pt || "").slice(0, 300);
  const img = imagemDe(item);
  const logo = { "@type": "ImageObject", url: `${SITE_BASE}/og.jpg` };
  const site = { "@type": "Organization", name: "Só mais um fã de Pearl Jam", url: `${SITE_BASE}/`, logo };
  const ld = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: titulo,
    description: desc,
    image: [img],
    datePublished: item.pubDate || undefined,
    dateModified: item.fetchedAt || item.pubDate || undefined,
    inLanguage: "pt-BR",
    mainEntityOfPage: url,
    author: site,
    publisher: site,
    isBasedOn: item.url || undefined,
    keywords: (item.tags || []).join(", ") || undefined,
  };
  const rotulo = esc(item.sourceLabel || (item.url ? "fonte original" : ""));
  const fonte = item.url ? `<a href="${esc(item.url)}" rel="noopener">${rotulo}</a>` : rotulo;
  const quando = item.pubDate ? `<time datetime="${esc(item.pubDate)}">${esc(dataExtenso(item.pubDate))}</time> · ` : "";
  const leia = relacionadasLista.map(r =>
    `<li><a href="/n/${esc(encodeURIComponent(r.id))}">${esc(r.title_pt || "Notícia")}</a></li>`).join("\n");
  const mostraIntro = desc && !String(body || "").trim().startsWith(desc.slice(0, 60));
  const corpo = [
    `<p class="meta">${quando}Fonte: ${fonte}</p>`,
    item.img ? `<figure style="margin:0 0 20px"><img src="${esc(item.img)}" alt="${esc(titulo)}" `
      + `style="width:100%;height:auto;border-radius:6px"></figure>` : "",
    mostraIntro ? `<p class="intro" style="font-size:20px;color:#3a342d">${esc(desc)}</p>` : "",
    corpoHtml(body),
    `<a class="cta" href="/#news/${esc(encodeURIComponent(item.id))}">Abrir no site</a>`,
    leia ? `<h2>Leia também</h2>\n<ul>\n${leia}\n</ul>` : "",
  ].filter(Boolean).join("\n");
  return pagina({
    titulo, descricao: desc, url, ld, trilha: [["Notícias", "/noticias/"]], corpo, imagem: img, tipoOg: "article",
  });
}

// Índice de todas as notícias, por mês (mais recentes primeiro).
export function paginaIndiceNoticias(itens) {
  const meses = {};
  for (const it of [...itens].sort(porData)) {
    const d = new Date(it.pubDate);
    const chave = isNaN(d) ? "Sem data"
      : d.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
    (meses[chave] ||= []).push(it);
  }
  const item = it => `<li><a href="/n/${esc(encodeURIComponent(it.id))}">${esc(it.title_pt || "Notícia")}</a></li>`;
  const corpo = `<p>${itens.length} notícias de Pearl Jam e Eddie Vedder em português, com fonte original.</p>\n`
    + Object.entries(meses).map(([mes, l]) => `<h2>${esc(mes)}</h2>\n<ul>\n${l.map(item).join("\n")}\n</ul>`).join("\n");
  return pagina({
    titulo: "Notícias do Pearl Jam e Eddie Vedder em português", h1: "Notícias",
    descricao: `Todas as ${itens.length} notícias de Pearl Jam e Eddie Vedder publicadas no site, em português.`,
    url: `${SITE_BASE}/noticias/`, corpo,
  });
}
