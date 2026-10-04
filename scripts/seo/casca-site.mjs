// Casca com a cara do site principal (index.html) pra página estática desenhada à parte (ex: /agenda/):
// mesmas fontes, mesmo CSS (/css/app.css + mobile), topo "ticket" com o nome do site e as abas da home como
// links reais (/#aba, que o SPA abre) mais a aba da própria página, ativa. Tema claro/escuro igual ao da home
// (mesma chave "theme" no localStorage, aplicado antes da pintura pra não piscar). Os trechos longos de HTML
// (fontes, CSS e ícones das redes) ficam em casca-site/*.html.
import fs from "node:fs";

const ler = (nome) => fs.readFileSync(new URL(`./casca-site/${nome}`, import.meta.url), "utf8").trimEnd();
export const CABECA_SITE = `${ler("cabeca.html")}\n<style>\n${ler("conteudo.css")}\n</style>`;
const REDES = ler("redes.html");

// Abas da home (mesma ordem e nomes, com Agenda depois de Notícias, como na home). [chave, rótulo]
const ABAS = [["news", "Notícias"], ["agenda", "Agenda"], ["timeline", "Timeline"], ["tabs", "Cifras &amp; Tabs"],
  ["banda", "BANDA"], ["gallery", "Galeria"], ["search", "Buscar"], ["ranking", "Ranking"], ["gaps", "Álbuns"],
  ["highlights", "Destaques"], ["rarity", "Raridades"], ["deep", "Deep"], ["forum", "Fórum"]];
const hrefAba = (chave) => (chave === "agenda" ? "/agenda/" : `/#${chave}`);

// Aba ativa pelo endereço da página estática.
const ABA_DA_PASTA = { show: "timeline", musica: "tabs", disco: "gaps", banda: "banda", noticias: "news", n: "news",
  agenda: "agenda" };
export const abaDaUrl = (url) => ABA_DA_PASTA[(String(url).match(/^https?:\/\/[^/]+\/([^/]+)/) || [])[1]] || "news";

// Botão de tema: mesmo comportamento da home (☀ no escuro, ☾ no claro), grava a mesma chave.
export const TEMA_JS = `<script>(function(){var b=document.getElementById("theme-toggle");
function p(t){b.textContent=t==="dark"?"\\u2600":"\\u263E";b.setAttribute("aria-pressed",t==="dark"?"true":"false")}
p(document.documentElement.getAttribute("data-theme"));b.addEventListener("click",function(){
var t=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";
document.documentElement.setAttribute("data-theme",t);try{localStorage.setItem("theme",t)}catch(e){}p(t)})})()</script>`;

// ativa: chave da aba da página. O nome do site usa <h1> como na home (o CSS do topo mira ".masthead h1");
// a página tem o próprio <h1> no conteúdo. Dois h1 é válido em HTML5 e o Google aceita.
export function topoSite(ativa) {
  const abas = ABAS.map(([k, r]) => `<a class="tab${k === ativa ? " active" : ""}${k === "forum" ? " has-dot" : ""}" `
    + `href="${hrefAba(k)}"${k === ativa ? ' aria-current="page"' : ""}>${r}</a>`).join("\n  ");
  return `<header class="masthead" role="banner">
  <div class="masthead-acoes">
    ${REDES}
    <button class="theme-toggle" id="theme-toggle" aria-label="Alternar tema escuro" aria-pressed="false">☾</button>
  </div>
  <h1 class="masthead-nome"><a class="masthead-home" href="/">Só mais um fã de <span class="accent-pj">Pearl Jam</span>`
    + `<br><span class="tag-sub">o que ouvi ao vivo</span></a></h1>
</header>
<nav class="tabs" aria-label="Seções do site">
  ${abas}
</nav>`;
}
