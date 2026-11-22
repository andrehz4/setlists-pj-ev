// Carrossel "Setlist completa" da 2ª noite (22/11/2026): slide 1 folha à mão, slide 2 lista numerada com o que não
// teve na sexta. Grava design/carrossel.html e legenda.txt a partir de setlist.json.
// Uso: node reels-especiais/setlist-dom/gera.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const s = JSON.parse(fs.readFileSync(path.join(dir, "setlist.json"), "utf8"));
const SEXTA = JSON.parse(fs.readFileSync(path.join(dir, "..", "eddie-balanco", "hoje.json"), "utf8"));
const norm = (t) => t.toLowerCase().replace(/[’‘`´]/g, "'").trim();
const naSexta = new Set(SEXTA.map(norm));
const CURTO = { "elderly woman behind the counter in a small town": "Elderly Woman" }; // só no slide, pra não quebrar em 3 linhas
const M = s.musicas.map((m, i) => ({ ...m, n: i + 1, nova: !naSexta.has(norm(m.nome)) }));
const curto = (t) => CURTO[norm(t)] || t;
const novas = M.filter((m) => m.nova), repetidas = M.length - novas.length;
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const BS = "font-family:'Big Shoulders Display',sans-serif;font-weight:900;";
const S = "width:1080px;height:1350px;position:relative;overflow:hidden;flex:none;background:var(--fundo);color:var(--claro);";
const tag = (t) => `<div style="display:inline-block;background:var(--destaque);color:var(--fundo);font-weight:900;font-size:24px;letter-spacing:.14em;padding:8px 14px;">${t}</div>`;

const slide1 = `<div data-screen-label="slide-01" style="${S}">
  <div style="position:absolute;top:34px;left:60px;right:60px;display:flex;justify-content:space-between;align-items:center;">${tag("SETLIST COMPLETA · 22/11")}<div style="${BS}font-size:40px;color:var(--destaque);">IBIRAPUERA · 2ª NOITE</div></div>
  <div style="position:absolute;top:110px;left:80px;width:920px;height:1171px;box-shadow:0 20px 50px rgba(0,0,0,.55);transform:rotate(-1deg);background:url(uploads/folha.jpg) center/cover;"></div>
  <div style="position:absolute;bottom:22px;right:60px;${BS}font-size:36px;color:var(--destaque);">ARRASTA →</div>
</div>`;

const linhas = Math.ceil(M.length / 2);
const fonte = M.length > 24 ? 29 : 32;
const item = (m, i) => {
  const sep = m.bis > 0 && (i === 0 || M[i - 1].bis !== m.bis) ? `<div style="${BS}font-size:26px;color:var(--destaque);letter-spacing:3px;margin:6px 0 2px;">BIS${m.bis > 1 ? " " + m.bis : ""}</div>` : "";
  return `${sep}<div style="display:flex;gap:12px;align-items:baseline;font-weight:800;font-size:${fonte}px;line-height:1.28;"><span style="${BS}color:var(--destaque);min-width:40px;text-align:right;">${m.n}</span><span>${esc(curto(m.nome))}${m.nova ? ` <span style="color:var(--destaque);">★</span>` : ""}</span></div>`;
};
const col = (arr, off) => arr.map((m, i) => item(m, i + off)).join("");
const slide2 = `<div data-screen-label="slide-02" style="${S}">
  <div style="position:absolute;top:60px;left:64px;right:64px;">${tag("EDDIE VEDDER · SÃO PAULO II")}<div style="margin-top:14px;${BS}font-size:96px;line-height:.9;text-transform:uppercase;color:var(--destaque);">${M.length} músicas</div></div>
  <div style="position:absolute;top:290px;left:64px;width:460px;">${col(M.slice(0, linhas), 0)}</div>
  <div style="position:absolute;top:290px;left:560px;width:470px;">${col(M.slice(linhas), linhas)}</div>
  <div style="position:absolute;bottom:110px;left:64px;right:64px;font-weight:800;font-size:30px;line-height:1.2;"><span style="color:var(--destaque);">★</span> ${novas.length ? `não tocou na sexta (${novas.length} de ${M.length})` : "repetiu tudo da sexta"}</div>
  <div style="position:absolute;bottom:40px;left:64px;right:64px;display:flex;justify-content:space-between;font-weight:700;font-size:22px;"><div>@smufdpj</div><div>Fonte: setlist.fm</div></div>
</div>`;

const html = `<!DOCTYPE html>
<!-- Gerado por reels-especiais/setlist-dom/gera.mjs (não editar à mão). Modelo: media/carrossel/ranking/modelo.html -->
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><script src="./support.js"></script></head>
<body><x-dc><helmet>
<meta name="design_doc_mode" content="canvas">
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Archivo:wght@500;700;800;900&display=swap" rel="stylesheet">
<style>:root{--destaque:#FFCC1A;--fundo:#14110F;--alerta:#E0361C;--papel:#f3efe6;--papel2:#E9E1CF;--claro:#fff;}body{margin:0;background:#1c1c1c;}</style>
</helmet>
<section style="display:flex;flex-wrap:wrap;gap:64px;padding:80px;align-items:flex-start;font-family:'Archivo',sans-serif;">
${slide1}
${slide2}
</section></x-dc></body></html>`;
fs.writeFileSync(path.join(dir, "design", "carrossel.html"), html);

let lista = "", bisAtual = 0;
for (const m of M) {
  if (m.bis !== bisAtual) { bisAtual = m.bis; lista += `\nBis${m.bis > 1 ? " " + m.bis : ""}\n`; }
  lista += `${m.n}. ${m.nome}${m.nova ? " ★" : ""}\n`;
}
const resumo = novas.length
  ? `Das ${M.length} músicas, ${novas.length} não tinham tocado na sexta (marcadas com ★) e ${repetidas} repetiram.`
  : `Ele repetiu as ${M.length} músicas da sexta.`;
const legenda = `Setlist completa da 2ª noite do Eddie Vedder no Ibirapuera, domingo 22/11.

${lista}
${resumo}

Qual foi a sua do domingo? Comenta aí.

Fonte: setlist.fm

#EddieVedder #PearlJam #Ibirapuera #SaoPaulo #BestOfBluesAndRock #Setlist`;
fs.writeFileSync(path.join(dir, "legenda.txt"), legenda);
console.log(`carrossel.html + legenda.txt: ${M.length} músicas, ${novas.length} novas`);
