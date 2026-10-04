// Casca com a cara do site principal (index.html) pra página estática desenhada à parte (ex: /agenda/):
// mesmas fontes, mesmo CSS (/css/app.css + mobile), topo "ticket" com o nome do site e as abas da home como
// links reais (/#aba, que o SPA abre) mais a aba da própria página, ativa. Tema claro/escuro igual ao da home
// (mesma chave "theme" no localStorage, aplicado antes da pintura pra não piscar). Os trechos longos de HTML
// (fontes, CSS e ícones das redes) ficam em casca-site/*.html.
import fs from "node:fs";
import { esc } from "./base.mjs";

const ler = (nome) => fs.readFileSync(new URL(`./casca-site/${nome}`, import.meta.url), "utf8").trimEnd();
export const CABECA_SITE = ler("cabeca.html");
const REDES = ler("redes.html");

// Abas da home (mesma ordem e nomes); a página atual entra logo depois de "Notícias".
const ABAS = [["news", "Notícias"], ["timeline", "Timeline"], ["tabs", "Cifras &amp; Tabs"], ["banda", "BANDA"],
  ["gallery", "Galeria"], ["search", "Buscar"], ["ranking", "Ranking"], ["gaps", "Álbuns"], ["highlights", "Destaques"],
  ["rarity", "Raridades"], ["deep", "Deep"], ["forum", "Fórum"]];

// Botão de tema: mesmo comportamento da home (☀ no escuro, ☾ no claro), grava a mesma chave.
export const TEMA_JS = `<script>(function(){var b=document.getElementById("theme-toggle");
function p(t){b.textContent=t==="dark"?"\\u2600":"\\u263E";b.setAttribute("aria-pressed",t==="dark"?"true":"false")}
p(document.documentElement.getAttribute("data-theme"));b.addEventListener("click",function(){
var t=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";
document.documentElement.setAttribute("data-theme",t);try{localStorage.setItem("theme",t)}catch(e){}p(t)})})()</script>`;

// aba: [href, rótulo] da página. O nome do site usa <h1> como na home (o CSS do topo mira ".masthead h1");
// a página tem o próprio <h1> no conteúdo. Dois h1 é válido em HTML5 e o Google aceita.
export function topoSite([href, rotulo]) {
  const abas = [ABAS[0], null, ...ABAS.slice(1)].map((a) => (a
    ? `<a class="tab${a[0] === "forum" ? " has-dot" : ""}" href="/#${a[0]}">${a[1]}</a>`
    : `<a class="tab active" href="${esc(href)}" aria-current="page">${esc(rotulo)}</a>`)).join("\n  ");
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
