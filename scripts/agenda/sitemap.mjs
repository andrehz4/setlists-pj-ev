// Seção da agenda no sitemap.xml (marcadores agenda:start/end; cada gerador só reescreve a sua).
import { SITE_BASE } from "../seo/layout.mjs";

const INI = "<!-- agenda:start -->", FIM = "<!-- agenda:end -->";

export function aplicarSitemap(atual) {
  const bloco = `${INI}\n  <url>\n    <loc>${SITE_BASE}/agenda/</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n${FIM}`;
  return atual.includes(INI) ? atual.replace(new RegExp(`${INI}[\\s\\S]*?${FIM}`), bloco) : atual.replace("</urlset>", `${bloco}\n</urlset>`);
}
