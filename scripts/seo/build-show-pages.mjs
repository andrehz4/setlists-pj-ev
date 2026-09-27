// Gera show/<id>.html (um por show), show/index.html (índice) e a seção de shows do sitemap.
// Fonte: SHOWS e MEDIA_MANIFEST do index.html. Rodar depois de mexer em show:
//   node scripts/seo/build-show-pages.mjs
// O teste scripts/seo/seo.test.mjs falha se as páginas ficarem desatualizadas.
import fs from "node:fs";
import path from "node:path";
import { SITE_BASE, esc } from "../news/news-page.mjs";
import { lerDadosSite } from "./dados-site.mjs";
import { paginaShow, tituloShow } from "./show-page.mjs";

const NOME = "Só mais um fã de Pearl Jam";

const linkShow = s => `<li><a href="/show/${esc(s.id)}">${esc(tituloShow(s))}</a></li>`;

export function paginaIndiceShows(shows) {
  const porAno = {};
  const ordenados = [...shows].sort((a, b) => b.date.localeCompare(a.date));
  for (const s of ordenados) (porAno[s.date.slice(0, 4)] ||= []).push(s);
  const blocos = Object.entries(porAno).sort((a, b) => b[0].localeCompare(a[0])).map(([ano, lista]) =>
    `<h2>${ano}</h2>\n<ul>\n${lista.map(linkShow).join("\n")}\n</ul>`);
  const desc = `Setlists completos de ${shows.length} shows de Pearl Jam e Eddie Vedder presenciados ao vivo, de 2005 a 2024.`;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Setlists de Pearl Jam e Eddie Vedder ao vivo | ${NOME}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE_BASE}/show/">
<meta property="og:title" content="Setlists de Pearl Jam e Eddie Vedder ao vivo">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${SITE_BASE}/og.jpg">
<style>
body{margin:0;background:#f4eee2;color:#1d1a16;font:18px/1.6 Georgia,serif}
.wrap{max-width:760px;margin:0 auto;padding:20px 16px 48px}
header a{color:#a8322b;text-decoration:none;font:600 13px system-ui,sans-serif;letter-spacing:.04em}
h1{font-size:clamp(26px,5vw,38px);line-height:1.15}
h2{font:700 15px system-ui,sans-serif;letter-spacing:.08em;color:#6d655b;margin-top:28px}
li{margin:6px 0}a{color:#1d1a16}
</style>
</head>
<body>
<div class="wrap">
<header><a href="/">${NOME.toUpperCase()}</a></header>
<h1>Setlists de Pearl Jam e Eddie Vedder ao vivo</h1>
<p>${esc(desc)}</p>
${blocos.join("\n")}
</div>
</body>
</html>
`;
}

export function secaoSitemap(shows) {
  const urls = [`${SITE_BASE}/show/`, ...shows.map(s => `${SITE_BASE}/show/${s.id}`)];
  const item = u => `  <url>\n    <loc>${esc(u)}</loc>\n    <changefreq>monthly</changefreq>\n`
    + "    <priority>0.7</priority>\n  </url>";
  return urls.map(item).join("\n");
}

// Devolve { caminho: conteúdo } de tudo que o gerador escreve (usado também pelo teste de sincronia).
export function gerarArquivos(dados, sitemapAtual) {
  const { shows, midia } = dados;
  const saida = { "show/index.html": paginaIndiceShows(shows) };
  for (const s of shows) saida[`show/${s.id}.html`] = paginaShow(s, shows, midia);
  const INI = "<!-- shows:start -->", FIM = "<!-- shows:end -->";
  const bloco = `${INI}\n${secaoSitemap(shows)}\n${FIM}`;
  saida["sitemap.xml"] = sitemapAtual.includes(INI)
    ? sitemapAtual.replace(new RegExp(`${INI}[\\s\\S]*?${FIM}`), bloco)
    : sitemapAtual.replace("</urlset>", `${bloco}\n</urlset>`);
  return saida;
}

const principal = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]));
if (principal) {
  const arquivos = gerarArquivos(lerDadosSite(), fs.readFileSync("sitemap.xml", "utf8"));
  fs.mkdirSync("show", { recursive: true });
  let n = 0;
  for (const [p, conteudo] of Object.entries(arquivos)) {
    if (fs.existsSync(p) && fs.readFileSync(p, "utf8") === conteudo) continue;
    fs.writeFileSync(p, conteudo);
    n++;
  }
  console.log(`[shows] ${n} arquivo(s) atualizados (${Object.keys(arquivos).length - 1} páginas + sitemap)`);
}
