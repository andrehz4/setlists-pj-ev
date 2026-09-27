// Gera as páginas estáticas de SEO a partir dos dados do site (index.html + media/):
//   show/<id>, show/ · musica/<slug>, musica/ · disco/<id>, disco/ · banda/ · seção seo do sitemap.
// Rodar depois de mexer em show, disco, interpretação ou nota de tradução:
//   node scripts/seo/build-seo-pages.mjs
// O teste scripts/seo/seo.test.mjs falha se as páginas ficarem desatualizadas.
// As notícias (n/ e noticias/) ficam com o publish: scripts/news/build-news-stubs.mjs.
import fs from "node:fs";
import path from "node:path";
import { esc, slug, SITE_BASE } from "./layout.mjs";
import { lerDadosSite } from "./dados-site.mjs";
import { paginaShow, paginaIndiceShows } from "./show-page.mjs";
import { catalogoMusicas, paginaMusica, paginaIndiceMusicas } from "./musica-page.mjs";
import { paginaDisco, paginaIndiceDiscos, paginaBanda } from "./disco-page.mjs";

const INI = "<!-- seo:start -->", FIM = "<!-- seo:end -->";

export function secaoSitemap(urls) {
  const item = ([u, prio]) => `  <url>\n    <loc>${esc(SITE_BASE + u)}</loc>\n    <changefreq>monthly</changefreq>\n`
    + `    <priority>${prio}</priority>\n  </url>`;
  return urls.map(item).join("\n");
}

export function aplicarSitemap(atual, urls) {
  const bloco = `${INI}\n${secaoSitemap(urls)}\n${FIM}`;
  const limpo = atual.replace(/<!-- shows:start -->[\s\S]*?<!-- shows:end -->\n?/, ""); // seção antiga, só de shows
  return limpo.includes(INI) ? limpo.replace(new RegExp(`${INI}[\\s\\S]*?${FIM}`), bloco)
    : limpo.replace("</urlset>", `${bloco}\n</urlset>`);
}

// Devolve { caminho: conteúdo } de tudo que o gerador escreve (usado também pelo teste de sincronia).
export function gerarArquivos(dados, sitemapAtual) {
  const catalogo = catalogoMusicas(dados);
  const comPagina = new Set(catalogo.map(m => m.slug));
  // Ano 0 = agrupamento interno do site (Lost Dogs, covers, misc), não disco de verdade.
  const discos = dados.albums.filter(a => a.year > 0 && (dados.ensaios[a.id] || catalogo.some(m => m.album?.id === a.id)));
  const saida = {
    "show/index.html": paginaIndiceShows(dados.shows),
    "musica/index.html": paginaIndiceMusicas(catalogo),
    "disco/index.html": paginaIndiceDiscos(discos),
  };
  if (dados.membros.length) saida["banda/index.html"] = paginaBanda(dados.membros);
  for (const s of dados.shows) saida[`show/${s.id}.html`] = paginaShow(s, dados.shows, dados.midia, comPagina);
  for (const m of catalogo) saida[`musica/${m.slug}.html`] = paginaMusica(m, catalogo);
  for (const a of discos) saida[`disco/${a.id}.html`] = paginaDisco(a, dados, catalogo);
  const urls = Object.keys(saida).map(p => {
    const u = "/" + p.replace(/index\.html$/, "").replace(/\.html$/, "");
    return [u, u.endsWith("/") ? "0.8" : "0.6"];
  });
  saida["sitemap.xml"] = aplicarSitemap(sitemapAtual, urls);
  return saida;
}

export { slug };

const principal = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]));
if (principal) {
  const arquivos = gerarArquivos(lerDadosSite(), fs.readFileSync("sitemap.xml", "utf8"));
  let n = 0;
  for (const [p, conteudo] of Object.entries(arquivos)) {
    if (fs.existsSync(p) && fs.readFileSync(p, "utf8") === conteudo) continue;
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, conteudo);
    n++;
  }
  console.log(`[seo] ${n} arquivo(s) atualizados de ${Object.keys(arquivos).length}`);
}
