// Gera design/carrossel.html: "São Paulo foi espetacular" (sexta 20/11 no Ibirapuera). Setlist escrita à mão + momentos
// da plateia contados pelo Andre. Fotos = quadros dos vídeos dele (show-ibirapuera/brutos), em design/uploads, fora do git.
// Uso: node reels-especiais/sp-espetacular/gera.mjs && node scripts/publish/carrossel/render.mjs \
//        reels-especiais/sp-espetacular/design/carrossel.html reels-especiais/sp-espetacular/saida laranja
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const SET = JSON.parse(fs.readFileSync(path.join(dir, "..", "eddie-balanco", "hoje.json"), "utf8"));
const TOTAL = 9;
const BS = "font-family:'Big Shoulders Display',sans-serif;font-weight:900;";
const MAO = "font-family:'Permanent Marker',cursive;";
const S = "width:1080px;height:1350px;position:relative;overflow:hidden;flex:none;";
const rodape = (n, fonte = "") => `
  <div style="position:absolute;bottom:40px;left:72px;right:72px;display:flex;align-items:center;justify-content:space-between;color:var(--claro);">
    <div style="display:flex;align-items:center;gap:14px;"><div style="width:62px;height:62px;border-radius:50%;overflow:hidden;border:3px solid var(--destaque);background:var(--papel);"><img src="uploads/selo-smufdpj.jpg" alt="selo" style="width:100%;height:100%;object-fit:cover;transform:scale(1.1);"></div><div style="font-weight:800;font-size:26px;">@smufdpj</div></div>
    <div style="display:flex;align-items:center;gap:22px;font-weight:700;font-size:22px;"><div>${fonte}</div><div style="${BS}font-size:30px;color:var(--destaque);">${String(n).padStart(2, "0")}/${TOTAL}</div></div>
  </div>`;
const tag = (txt) => `<div style="display:inline-block;background:var(--destaque);color:var(--fundo);font-weight:900;font-size:24px;letter-spacing:.14em;padding:8px 14px;">${txt}</div>`;
const tit = (t, tam) => `<div style="margin-top:18px;${BS}font-size:${tam}px;line-height:.88;text-transform:uppercase;letter-spacing:-2px;color:var(--destaque);">${t}</div>`;
const txt = (t, top, tam = 40) => `<div style="position:absolute;top:${top}px;left:72px;right:72px;font-weight:800;font-size:${tam}px;line-height:1.22;">${t}</div>`;
// Slide com foto no alto e texto embaixo, degradê levando a foto pro fundo
const foto = (n, img, pos, alto, corpo) => `<div data-screen-label="slide-${String(n).padStart(2, "0")}" style="${S}background:var(--fundo);color:var(--claro);">
  <img src="uploads/${img}" alt="" style="position:absolute;top:0;left:0;width:1080px;height:${alto}px;object-fit:cover;object-position:${pos};">
  <div style="position:absolute;top:0;left:0;width:1080px;height:${alto + 20}px;background:linear-gradient(180deg,rgba(20,17,15,.55) 0%,rgba(20,17,15,0) 22%,rgba(20,17,15,0) 50%,var(--fundo) 98%);"></div>
  ${corpo}${rodape(n)}</div>`;

const slides = [];
slides.push(`<div data-screen-label="slide-01" style="${S}background:var(--fundo);color:var(--claro);">
  <img src="uploads/lanternas.jpg" alt="Plateia com lanternas acesas" style="position:absolute;top:0;left:0;width:1080px;height:1350px;object-fit:cover;object-position:50% 40%;">
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,17,15,.75) 0%,rgba(20,17,15,.1) 34%,rgba(20,17,15,.2) 55%,var(--fundo) 88%);"></div>
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("SEXTA, 20/11 · IBIRAPUERA")}</div>
  <div style="position:absolute;top:760px;left:64px;right:40px;${BS}font-size:150px;line-height:.86;letter-spacing:-3px;text-transform:uppercase;">São Paulo foi<br><span style="color:var(--destaque);">espetacular</span></div>
  ${txt("A setlist escrita à mão e os momentos em que a plateia roubou a cena.", 1050, 36)}
  <div style="position:absolute;bottom:130px;right:64px;${BS}font-size:44px;color:var(--destaque);letter-spacing:2px;">ARRASTA →</div>
  ${rodape(1)}</div>`);

// Setlist: folha do gerador do site (folha.mjs), letras de mão por música, sem nada por cima
slides.push(`<div data-screen-label="slide-02" style="${S}background:#fff;"><img src="uploads/folha.jpg" alt="Setlist de sexta escrita à mão" style="width:1080px;height:1350px;object-fit:cover;"></div>`);

slides.push(foto(3, "inicio.jpg", "50% 30%", 820, `
  <div style="position:absolute;top:72px;left:72px;">${tag("ANTES DO SHOW")}</div>
  <div style="position:absolute;top:640px;left:64px;right:40px;${MAO}font-size:132px;line-height:.95;color:var(--destaque);transform:rotate(-3deg);">EDINHO!<br>EDINHO!</div>
  ${txt("Ninguém gritou Eddie Vedder. Antes dele entrar, o Ibirapuera inteiro chamou por Edinho. Foi muito engraçado.", 990)}`));

slides.push(foto(4, "canta.jpg", "50% 35%", 820, `
  <div style="position:absolute;top:72px;left:72px;">${tag("O CORO")}</div>
  <div style="position:absolute;top:700px;left:64px;right:40px;">${tit("Cada brecha virou coro", 112)}</div>
  ${txt("Em toda música que deixava espaço pro público, a galera soltou a voz. Em Wishlist, o parque inteiro cantou junto.", 960)}`));

slides.push(foto(5, "telao.jpg", "50% 45%", 840, `
  <div style="position:absolute;top:72px;left:72px;">${tag("AS LANTERNAS")}</div>
  <div style="position:absolute;top:700px;left:64px;right:40px;">${tit("Um mar de luz", 120)}</div>
  ${txt("Todo mundo levantou o celular com a lanterna acesa. O telão atrás do Eddie mostrava a plateia, e o palco inteiro ficou iluminado.", 960)}`));

slides.push(foto(6, "violao.jpg", "50% 35%", 640, `
  <div style="position:absolute;top:72px;left:72px;">${tag("SONG OF GOOD HOPE")}</div>
  <div style="position:absolute;top:520px;left:64px;right:40px;">${tit("Pro Glen, e pra ele também", 100)}</div>
  ${txt("O Eddie tocou a música do Glen Hansard como homenagem. E contou que ela também era pra ele mesmo, num momento difícil.", 760, 36)}
  ${txt("Falou da importância de deixar ir quem a gente ama e de viver o luto. O parque cantou junto. É das mais queridas pelos fãs, e foi um presente.", 960, 36)}`));

slides.push(`<div data-screen-label="slide-07" style="${S}background:var(--destaque);color:var(--fundo);">
  <div style="position:absolute;top:72px;left:72px;"><div style="display:inline-block;background:var(--fundo);color:var(--destaque);font-weight:900;font-size:24px;letter-spacing:.14em;padding:8px 14px;">O PEDIDO</div></div>
  <div style="position:absolute;top:180px;left:56px;right:30px;${MAO}font-size:150px;line-height:1;transform:rotate(-3deg);">tchururu,<br>tchururu...</div>
  ${txt("A galera começou a cantarolar a melodia de Black. Meio sem jeito, o Eddie atendeu.", 560, 42)}
  <div style="position:absolute;top:790px;left:72px;right:72px;">
    ${[["Black na carreira solo", "antes de sexta, nos shows do setlist.fm", "23x"], ["A última vez sozinho", "Tempe, nos EUA", "2023"]].map(([a, b, c]) => `<div style="display:flex;align-items:center;justify-content:space-between;padding:18px 0;border-top:4px solid var(--fundo);">
      <div><div style="font-weight:900;font-size:40px;">${a}</div><div style="margin-top:6px;font-weight:700;font-size:25px;opacity:.8;">${b}</div></div><div style="${BS}font-size:96px;line-height:.9;">${c}</div></div>`).join("")}</div>
  <div style="position:absolute;bottom:40px;left:72px;right:72px;display:flex;justify-content:space-between;font-weight:800;font-size:26px;"><div>@smufdpj</div><div>Fonte: setlist.fm · <span style="${BS}font-size:30px;">07/${TOTAL}</span></div></div></div>`);

slides.push(foto(8, "bandeira.jpg", "50% 30%", 760, `
  <div style="position:absolute;top:72px;left:72px;">${tag("PRIMEIRA VEZ")}</div>
  <div style="position:absolute;top:600px;left:64px;right:40px;">${tit("Primeiro solo a céu aberto em SP", 100)}</div>
  ${txt("Em 2014 e 2018, o Eddie tocou sozinho em São Paulo numa casa de shows fechada, o Citibank Hall. Desta vez foi no parque, pra muito mais gente.", 860, 36)}
  ${txt("Teve gente chorando e gente cantando a plenos pulmões.", 1060, 36)}`));

slides.push(`<div data-screen-label="slide-09" style="${S}background:var(--fundo);color:var(--claro);">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("E VOCÊ?")}${tit("Qual foi o seu momento?", 150)}</div>
  ${txt("Estava no Ibirapuera? Conta aqui o que te pegou na sexta.", 640, 46)}
  <div style="position:absolute;top:900px;left:72px;right:72px;background:var(--destaque);color:var(--fundo);padding:22px 28px;font-weight:900;font-size:34px;">Domingo tem mais. A gente volta pro parque e conta tudo aqui.</div>
  ${rodape(9)}</div>`);

const html = `<!DOCTYPE html>
<!-- Gerado por reels-especiais/sp-espetacular/gera.mjs (não editar à mão). Modelo: media/carrossel/ranking/modelo.html -->
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><script src="./support.js"></script></head>
<body><x-dc><helmet>
<meta name="design_doc_mode" content="canvas">
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Archivo:wght@500;700;800;900&family=Permanent+Marker&display=swap" rel="stylesheet">
<style>:root{--destaque:#FFCC1A;--fundo:#14110F;--alerta:#E0361C;--papel:#f3efe6;--papel2:#E9E1CF;--claro:#fff;}body{margin:0;background:#1c1c1c;}</style>
</helmet>
<section style="display:flex;flex-wrap:wrap;gap:64px;padding:80px;align-items:flex-start;font-family:'Archivo',sans-serif;">
${slides.join("\n")}
</section></x-dc></body></html>`;
fs.writeFileSync(path.join(dir, "design", "carrossel.html"), html);
console.log("design/carrossel.html:", slides.length, "slides");
