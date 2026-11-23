// Carrossel "A guitarra verde de Sérgio Vedder" (22/11/2026): a história da Brazilcaster, feita à mão pelo Sérgio
// (vocalista da @blaymorphed) e dada ao Eddie, que tocou Lukin e Wishlist com ela no Ibirapuera. Molde amarelo do setlist-dom.
// Fontes: PJ20BR "Sergio Vedder e suas Guitarras" (2013), "O presente / The gift" (2014), Brasília 17/11/2015, bandas.json.
// Fotos: só quadros do vídeo do Andre (design/uploads). Uso: node reels-especiais/guitarra-sergio/gera.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const BS = "font-family:'Big Shoulders Display',sans-serif;font-weight:900;";
const S = "width:1080px;height:1350px;position:relative;overflow:hidden;flex:none;";
const CAPS = [
  { tag: "QUEM É", titulo: "Sérgio Vedder", foto: "eddie-sergio.jpg", texto: "Vocalista da Blaymorphed, banda cover de Pearl Jam de Santo André desde 2000, e luthier. Monta à mão réplicas das guitarras do Eddie, peça por peça." },
  { tag: "2014 · SÃO PAULO", titulo: "O cara da camiseta do Fear", texto: "Primeira turnê solo do Eddie no Brasil. No meio do show ele apontou pro público: “aquele cara com a camiseta do Fear”, banda punk que ele adora. Era o Sérgio. Subiu ao palco e os dois cantaram juntos. Nada combinado." },
  { tag: "2014 · RIO", titulo: "O pedestal", texto: "Na saída de um show, o Sérgio entregou ao Eddie fotos das réplicas que ele fazia. No dia seguinte, Dia das Mães, último show da turnê, o Eddie chamou o Sérgio ao palco só pra dar um presente: o pedestal de microfone dos shows solo." },
  { tag: "2015 · A RESPOSTA", titulo: "A Brazilcaster", texto: "O Sérgio juntou amigos luthiers e fez uma Telecaster de 1963 com as cores do Brasil: verde com brilho, escudo dourado, madeira nacional e as estrelas dos estados marcando o braço. Entregou no Morumbi. No meio de um show o palco ficou verde, o Eddie se virou e lá estava ela." },
  { tag: "2018 · SÃO PAULO", titulo: "Black, juntos", texto: "Turnê solo de novo. O Eddie chamou o Sérgio pra cantar Black, rara nos shows solo, e ele dedicou a uma amiga que tinha morrido. Na mesma noite a Brazilcaster subiu ao palco." },
];
const TOTAL = 3 + CAPS.length;
const rodape = (n) => `
  <div style="position:absolute;bottom:40px;left:72px;right:72px;display:flex;align-items:center;justify-content:space-between;color:var(--claro);">
    <div style="display:flex;align-items:center;gap:14px;"><div style="width:62px;height:62px;border-radius:50%;overflow:hidden;border:3px solid var(--destaque);background:var(--papel);"><img src="uploads/selo-smufdpj.jpg" alt="selo" style="width:100%;height:100%;object-fit:cover;transform:scale(1.1);"></div><div style="font-weight:800;font-size:26px;">@smufdpj</div></div>
    <div style="${BS}font-size:30px;color:var(--destaque);">${String(n).padStart(2, "0")}/${TOTAL}</div>
  </div>`;
const tag = (t) => `<div style="display:inline-block;background:var(--destaque);color:var(--fundo);font-weight:900;font-size:24px;letter-spacing:.14em;padding:8px 14px;">${t}</div>`;
const tit = (t, tam) => `<div style="margin-top:18px;${BS}font-size:${tam}px;line-height:.88;text-transform:uppercase;letter-spacing:-2px;color:var(--destaque);">${t}</div>`;
const txt = (t, top, tam = 44) => `<div style="position:absolute;top:${top}px;left:72px;right:72px;font-weight:800;font-size:${tam}px;line-height:1.24;">${t}</div>`;
const slide = (n, corpo) => `<div data-screen-label="slide-${String(n).padStart(2, "0")}" style="${S}background:var(--fundo);color:var(--claro);">${corpo}${rodape(n)}</div>`;

const slides = [];
let n = 1;
slides.push(slide(n++, `
  <img src="uploads/capa.jpg" alt="Eddie Vedder com a guitarra verde" style="position:absolute;inset:0;width:1080px;height:1350px;object-fit:cover;">
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,17,15,.55) 0%,rgba(20,17,15,0) 22%,rgba(20,17,15,.35) 50%,var(--fundo) 86%);"></div>
  <div style="position:absolute;top:72px;left:72px;">${tag("IBIRAPUERA · 22/11")}</div>
  <div style="position:absolute;top:800px;left:64px;right:40px;${BS}font-size:128px;line-height:.86;letter-spacing:-3px;text-transform:uppercase;">A guitarra verde de<br><span style="color:var(--destaque);">Sérgio Vedder</span></div>
  <div style="position:absolute;bottom:130px;right:64px;${BS}font-size:44px;color:var(--destaque);letter-spacing:2px;">ARRASTA →</div>`));
for (const c of CAPS) {
  if (c.foto) {
    slides.push(slide(n++, `
  <img src="uploads/${c.foto}" alt="Eddie Vedder e Sérgio Vedder" style="position:absolute;top:0;left:0;width:1080px;height:630px;object-fit:cover;">
  <div style="position:absolute;top:0;left:0;width:1080px;height:650px;background:linear-gradient(180deg,rgba(20,17,15,0) 70%,var(--fundo) 100%);"></div>
  <div style="position:absolute;top:24px;right:28px;background:rgba(20,17,15,.75);color:var(--claro);font-weight:800;font-size:22px;padding:6px 12px;">Foto: arquivo @sergiovedder</div>
  <div style="position:absolute;top:660px;left:72px;right:72px;">${tag(c.tag)}${tit(c.titulo, 150)}</div>
  ${txt(c.texto, 940)}`));
    continue;
  }
  slides.push(slide(n++, `
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag(c.tag)}${tit(c.titulo, c.titulo.length > 22 ? 110 : 150)}</div>
  ${txt(c.texto, c.titulo.length > 22 ? 420 : 340)}`));
}
slides.push(slide(n++, `
  <img src="uploads/guitarra-verde.jpg" alt="Eddie Vedder com a guitarra verde no Ibirapuera" style="position:absolute;top:0;left:0;width:1080px;height:860px;object-fit:cover;">
  <div style="position:absolute;top:0;left:0;width:1080px;height:880px;background:linear-gradient(180deg,rgba(20,17,15,.55) 0%,rgba(20,17,15,0) 22%,rgba(20,17,15,0) 50%,var(--fundo) 98%);"></div>
  <div style="position:absolute;top:600px;left:72px;right:72px;">${tag("2026 · IBIRAPUERA")}${tit("Lukin e Wishlist", 120)}</div>
  ${txt("Domingo, 22/11, segunda noite em São Paulo. Lukin e Wishlist saíram dela.", 930, 40)}`));
slides.push(slide(n++, `
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("2026")}${tit("Onze anos depois", 150)}</div>
  ${txt("A guitarra que um fã brasileiro fez pro ídolo ainda viaja com ele. Você já viu a Brazilcaster ao vivo? Conta aqui.", 560, 46)}
  <div style="position:absolute;top:900px;left:72px;right:72px;background:var(--destaque);color:var(--fundo);padding:22px 28px;font-weight:900;font-size:34px;">Valeu, @sergiovedder. Segue a @blaymorphed.</div>`));

const html = `<!DOCTYPE html>
<!-- Gerado por reels-especiais/guitarra-sergio/gera.mjs (não editar à mão). Molde: reels-especiais/setlist-dom -->
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

const legenda = `A guitarra verde que o Eddie tocou em Lukin e Wishlist no Ibirapuera é brasileira. É a Brazilcaster, feita pelo Sérgio Vedder (@sergiovedder), vocalista da @blaymorphed.\n\n2014: na primeira turnê solo do Eddie no Brasil, ele chama ao palco \"aquele cara com a camiseta do Fear\". Era o Sérgio. No Rio, dias depois, o Eddie o chama de novo só pra dar de presente o pedestal de microfone dos shows solo.\n\n2015: o Sérgio e amigos luthiers fazem uma Telecaster de 1963 com as cores do Brasil, verde, escudo dourado, madeira nacional, estrelas dos estados no braço. Ele entrega no Morumbi e o Eddie toca com ela na turnê.\n\n2018: os dois cantam Black juntos em São Paulo, e a Brazilcaster sobe ao palco de novo.\n\n2026: Lukin e Wishlist, domingo, 22/11, no @bestofbluesandrock. Onze anos depois, ela ainda viaja com ele.\n\nA história inteira o Sérgio contou numa entrevista ao canal Aléxia Loren no YouTube.\n\nVocê já viu a Brazilcaster ao vivo? Conta aí.\n\n#EddieVedder #PearlJam #Ibirapuera #SaoPaulo #BandaCover #Blaymorphed`;
fs.writeFileSync(path.join(dir, "legenda.txt"), legenda);
console.log(`carrossel.html + legenda.txt: ${slides.length} slides`);
