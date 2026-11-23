// Carrossel "Setlist completa" da 2ª noite (22/11/2026), no molde do "Edinho? São Paulo foi espetacular": capa com a foto
// da setlist à mão, folha do gerador, lista em amarelo (★ = não teve na sexta), pergunta. Grava design/carrossel.html e legenda.txt a partir de setlist.json.
// Uso: node reels-especiais/setlist-dom/gera.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { slidesStats } from "./stats.mjs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const s = JSON.parse(fs.readFileSync(path.join(dir, "setlist.json"), "utf8"));
const SEXTA = JSON.parse(fs.readFileSync(path.join(dir, "..", "eddie-balanco", "hoje.json"), "utf8"));
const norm = (t) => t.toLowerCase().replace(/[’‘`´]/g, "'").trim();
const naSexta = new Set(SEXTA.map(norm));
const CURTO = { "elderly woman behind the counter in a small town": "Elderly Woman" }; // só no slide, pra não quebrar em 3 linhas
const M = s.musicas.map((m, i) => ({ ...m, n: i + 1, nova: !naSexta.has(norm(m.nome)) }));
const curto = (t) => CURTO[norm(t)] || t;
const novas = M.filter((m) => m.nova), repetidas = M.length - novas.length;
// Momentos do show contados pelo Andre no chat (momentos.json): cada um vira slide; "intro" abre a legenda
const MOM = fs.existsSync(path.join(dir, "momentos.json")) ? JSON.parse(fs.readFileSync(path.join(dir, "momentos.json"), "utf8")) : { momentos: [] };
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
// Capa: foto da setlist de papel de verdade (design/uploads/foto-setlist.jpg, se o Andre mandar); sem ela, a folha do gerador
const FOTO = fs.existsSync(path.join(dir, "design", "uploads", "foto-setlist.jpg")) ? "foto-setlist.jpg" : "folha.jpg";
const TOTAL = Math.min(10, (FOTO === "folha.jpg" ? 5 : 6) + MOM.momentos.length); // +2: estatística (stats.mjs)
const BS = "font-family:'Big Shoulders Display',sans-serif;font-weight:900;";
const S = "width:1080px;height:1350px;position:relative;overflow:hidden;flex:none;";
const rodape = (n) => `
  <div style="position:absolute;bottom:40px;left:72px;right:72px;display:flex;align-items:center;justify-content:space-between;color:var(--claro);">
    <div style="display:flex;align-items:center;gap:14px;"><div style="width:62px;height:62px;border-radius:50%;overflow:hidden;border:3px solid var(--destaque);background:var(--papel);"><img src="uploads/selo-smufdpj.jpg" alt="selo" style="width:100%;height:100%;object-fit:cover;transform:scale(1.1);"></div><div style="font-weight:800;font-size:26px;">@smufdpj</div></div>
    <div style="${BS}font-size:30px;color:var(--destaque);">${String(n).padStart(2, "0")}/${TOTAL}</div>
  </div>`;
const tag = (t, inv) => `<div style="display:inline-block;background:var(--${inv ? "fundo" : "destaque"});color:var(--${inv ? "destaque" : "fundo"});font-weight:900;font-size:24px;letter-spacing:.14em;padding:8px 14px;">${t}</div>`;
const tit = (t, tam) => `<div style="margin-top:18px;${BS}font-size:${tam}px;line-height:.88;text-transform:uppercase;letter-spacing:-2px;color:var(--destaque);">${t}</div>`;
const txt = (t, top, tam = 40) => `<div style="position:absolute;top:${top}px;left:72px;right:72px;font-weight:800;font-size:${tam}px;line-height:1.22;">${t}</div>`;
const sub = novas.length ? `${M.length} músicas, ${novas.length} que não tocaram na sexta.` : `${M.length} músicas, as mesmas da sexta.`;

const slides = [];
let n = 1;
slides.push(`<div data-screen-label="slide-01" style="${S}background:var(--fundo);color:var(--claro);">
  <img src="uploads/${FOTO}" alt="Setlist escrita à mão" style="position:absolute;top:0;left:0;width:1080px;height:1350px;object-fit:cover;object-position:50% 30%;">
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,17,15,.7) 0%,rgba(20,17,15,.05) 26%,rgba(20,17,15,.5) 52%,var(--fundo) 84%);"></div>
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("DOMINGO, 22/11 · IBIRAPUERA")}</div>
  <div style="position:absolute;top:770px;left:64px;right:40px;${BS}font-size:150px;line-height:.86;letter-spacing:-3px;text-transform:uppercase;">A setlist da<br><span style="color:var(--destaque);">2ª noite</span></div>
  ${txt(sub + " Tudo aqui, do começo ao bis.", 1060, 36)}
  <div style="position:absolute;bottom:130px;right:64px;${BS}font-size:44px;color:var(--destaque);letter-spacing:2px;">ARRASTA →</div>
  ${rodape(n++)}</div>`);

if (FOTO !== "folha.jpg") { // folha do gerador inteira, sem nada por cima (como no carrossel de sexta)
  slides.push(`<div data-screen-label="slide-0${n++}" style="${S}background:#fff;"><img src="uploads/folha.jpg" alt="Setlist do domingo escrita à mão" style="width:1080px;height:1350px;object-fit:cover;"></div>`);
}

const linhas = Math.ceil(M.length / 2), fonte = M.length > 24 ? 30 : 33;
const item = (m, i) => {
  const sep = m.bis > 0 && (i === 0 || M[i - 1].bis !== m.bis) ? `<div style="${BS}font-size:28px;letter-spacing:3px;margin:8px 0 2px;border-top:4px solid var(--fundo);padding-top:6px;">BIS${m.bis > 1 ? " " + m.bis : ""}</div>` : "";
  return `${sep}<div style="display:flex;gap:12px;align-items:baseline;font-weight:800;font-size:${fonte}px;line-height:1.28;"><span style="${BS}min-width:40px;text-align:right;opacity:.6;">${m.n}</span><span>${esc(curto(m.nome))}${m.nova ? " ★" : ""}</span></div>`;
};
const col = (arr, off) => arr.map((m, i) => item(m, i + off)).join("");
slides.push(`<div data-screen-label="slide-0${n}" style="${S}background:var(--destaque);color:var(--fundo);">
  <div style="position:absolute;top:72px;left:72px;">${tag("A SETLIST", true)}<div style="margin-top:14px;${BS}font-size:110px;line-height:.9;text-transform:uppercase;letter-spacing:-2px;">${M.length} músicas</div></div>
  <div style="position:absolute;top:310px;left:72px;width:450px;">${col(M.slice(0, linhas), 0)}</div>
  <div style="position:absolute;top:310px;left:560px;width:470px;">${col(M.slice(linhas), linhas)}</div>
  <div style="position:absolute;bottom:110px;left:72px;right:72px;font-weight:900;font-size:30px;">${novas.length ? `★ não tocou na sexta (${novas.length} de ${M.length})` : "Repetiu tudo da sexta"}</div>
  <div style="position:absolute;bottom:40px;left:72px;right:72px;display:flex;justify-content:space-between;font-weight:800;font-size:26px;"><div>@smufdpj</div><div>Fonte: ${s.fonte || "setlist.fm"} · <span style="${BS}font-size:30px;">${String(n).padStart(2, "0")}/${TOTAL}</span></div></div></div>`);

n++;
slides.push(...slidesStats({ S, BS, tag, tit, rodape, n }));
n += 2;
// Momento: foto no alto com degradê (quadro do vídeo do Andre em design/uploads/) ou só texto; máx. 10 slides no IG
for (const m of MOM.momentos.slice(0, 10 - n)) {
  const corpo = `<div style="position:absolute;top:${m.foto ? 570 : 72}px;left:72px;right:72px;">${tag(esc(m.tag))}${tit(esc(m.titulo), m.titulo.length > 22 ? 96 : 120)}</div>
  ${txt(esc(m.texto), m.foto ? 930 : 560, m.foto ? 36 : 44)}`;
  slides.push(`<div data-screen-label="slide-${String(n).padStart(2, "0")}" style="${S}background:var(--fundo);color:var(--claro);">
  ${m.foto ? `<img src="uploads/${m.foto}" alt="" style="position:absolute;top:0;left:0;width:1080px;height:860px;object-fit:cover;object-position:${m.pos || "50% 40%"};">
  <div style="position:absolute;top:0;left:0;width:1080px;height:880px;background:linear-gradient(180deg,rgba(20,17,15,.55) 0%,rgba(20,17,15,0) 22%,rgba(20,17,15,0) 50%,var(--fundo) 98%);"></div>` : ""}
  ${corpo}${rodape(n++)}</div>`);
}
slides.push(`<div data-screen-label="slide-${String(n).padStart(2, "0")}" style="${S}background:var(--fundo);color:var(--claro);">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("E VOCÊ?")}${tit("Qual foi a sua do domingo?", 150)}</div>
  ${txt("Estava no Ibirapuera? Conta aqui a música que te pegou na 2ª noite.", 640, 46)}
  <div style="position:absolute;top:900px;left:72px;right:72px;background:var(--destaque);color:var(--fundo);padding:22px 28px;font-weight:900;font-size:34px;">Foram duas noites. Obrigado, Edinho.</div>
  ${rodape(n)}</div>`);

const html = `<!DOCTYPE html>
<!-- Gerado por reels-especiais/setlist-dom/gera.mjs (não editar à mão). Modelo: media/carrossel/ranking/modelo.html -->
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><script src="./support.js"></script></head>
<body><x-dc><helmet>
<meta name="design_doc_mode" content="canvas">
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Archivo:wght@500;700;800;900&display=swap" rel="stylesheet">
<style>:root{--destaque:#FFCC1A;--fundo:#14110F;--alerta:#E0361C;--papel:#f3efe6;--papel2:#E9E1CF;--claro:#fff;}body{margin:0;background:#1c1c1c;}</style>
</helmet>
<section style="display:flex;flex-wrap:wrap;gap:64px;padding:80px;align-items:flex-start;font-family:'Archivo',sans-serif;">
${slides.join("\n")}
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
${MOM.intro ? "\n" + MOM.intro + "\n" : ""}
${lista}
${resumo}

Qual foi a sua do domingo? Comenta aí.

Fonte: ${s.fonte || "setlist.fm"}

#EddieVedder #PearlJam #Ibirapuera #SaoPaulo #BestOfBluesAndRock #Setlist`;
fs.writeFileSync(path.join(dir, "legenda.txt"), legenda);
console.log(`carrossel.html + legenda.txt: ${M.length} músicas, ${novas.length} novas`);
