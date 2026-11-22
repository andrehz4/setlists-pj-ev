// Gera design/carrossel.html: "Rolou!" informativo, Eddie no show do Roger Daltrey (21/11, Ibirapuera). Sai junto do
// reel eddie-roger-rolou. Quadros do vídeo do Andre em design/uploads (fora do git). Números: setlist.fm
// (eddie-carreira/bruto) e a lista de encontros do carrossel da previsão (eddie-daltrey/gera.mjs).
// Uso: node reels-especiais/eddie-roger-carrossel/gera.mjs && node scripts/publish/carrossel/render.mjs \
//        reels-especiais/eddie-roger-carrossel/design/carrossel.html reels-especiais/eddie-roger-carrossel/saida amarelo
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const TOTAL = 7;
const BS = "font-family:'Big Shoulders Display',sans-serif;font-weight:900;";
const S = "width:1080px;height:1350px;position:relative;overflow:hidden;flex:none;";
const rodape = (n, fonte = "") => `
  <div style="position:absolute;bottom:40px;left:72px;right:72px;display:flex;align-items:center;justify-content:space-between;color:var(--claro);">
    <div style="display:flex;align-items:center;gap:14px;"><div style="width:62px;height:62px;border-radius:50%;overflow:hidden;border:3px solid var(--destaque);background:var(--papel);"><img src="uploads/selo-smufdpj.jpg" alt="selo" style="width:100%;height:100%;object-fit:cover;transform:scale(1.1);"></div><div style="font-weight:800;font-size:26px;">@smufdpj</div></div>
    <div style="display:flex;align-items:center;gap:22px;font-weight:700;font-size:22px;"><div>${fonte}</div><div style="${BS}font-size:30px;color:var(--destaque);">${String(n).padStart(2, "0")}/${TOTAL}</div></div>
  </div>`;
const tag = (txt) => `<div style="display:inline-block;background:var(--destaque);color:var(--fundo);font-weight:900;font-size:24px;letter-spacing:.14em;padding:8px 14px;">${txt}</div>`;
const tit = (t, tam) => `<div style="margin-top:18px;${BS}font-size:${tam}px;line-height:.88;text-transform:uppercase;letter-spacing:-2px;color:var(--destaque);">${t}</div>`;
const txt = (t, top, tam = 40) => `<div style="position:absolute;top:${top}px;left:72px;right:72px;font-weight:800;font-size:${tam}px;line-height:1.22;">${t}</div>`;
const foto = (n, img, pos, alto, corpo, fonte = "") => `<div data-screen-label="slide-${String(n).padStart(2, "0")}" style="${S}background:var(--fundo);color:var(--claro);">
  <img src="uploads/${img}" alt="" style="position:absolute;top:0;left:0;width:1080px;height:${alto}px;object-fit:cover;object-position:${pos};">
  <div style="position:absolute;top:0;left:0;width:1080px;height:${alto + 20}px;background:linear-gradient(180deg,rgba(20,17,15,.55) 0%,rgba(20,17,15,0) 22%,rgba(20,17,15,0) 50%,var(--fundo) 98%);"></div>
  ${corpo}${rodape(n, fonte)}</div>`;
const numero = (grande, legenda) => `<div style="display:flex;align-items:center;gap:30px;padding:20px 0;border-top:4px solid var(--destaque);">
  <div style="${BS}font-size:120px;line-height:.85;color:var(--destaque);min-width:230px;">${grande}</div><div style="font-weight:800;font-size:34px;line-height:1.2;">${legenda}</div></div>`;

const slides = [];
slides.push(`<div data-screen-label="slide-01" style="${S}background:var(--fundo);color:var(--claro);">
  <img src="uploads/q6.0.jpg" alt="Eddie Vedder canta no show do Roger Daltrey" style="position:absolute;top:0;left:0;width:1080px;height:1350px;object-fit:cover;object-position:50% 30%;">
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,17,15,.7) 0%,rgba(20,17,15,.05) 30%,rgba(20,17,15,.25) 50%,var(--fundo) 85%);"></div>
  <div style="position:absolute;top:72px;left:72px;">${tag("SÁBADO, 21/11 · IBIRAPUERA")}</div>
  <div style="position:absolute;top:720px;left:64px;right:40px;${BS}font-size:150px;line-height:.86;letter-spacing:-3px;text-transform:uppercase;"><span style="color:var(--destaque);-webkit-text-stroke:10px #000;paint-order:stroke fill;">Rolou!</span><br>Eddie no palco<br>do Roger</div>
  ${txt("Pinball Wizard e The Kids Are Alright. Os números de cada uma.", 1150, 36)}
  ${rodape(1)}</div>`);

slides.push(foto(2, "q8.5.jpg", "50% 30%", 760, `
  <div style="position:absolute;top:72px;left:72px;">${tag("O QUE ROLOU")}</div>
  <div style="position:absolute;top:640px;left:64px;right:40px;">${tit("Duas do The Who", 120)}</div>
  ${txt("O Eddie subiu no show do Roger Daltrey e os dois cantaram Pinball Wizard e The Kids Are Alright, com o parque inteiro de celular pro alto.", 900)}`));

slides.push(`<div data-screen-label="slide-03" style="${S}background:var(--destaque);color:var(--fundo);">
  <div style="position:absolute;top:72px;left:72px;"><div style="display:inline-block;background:var(--fundo);color:var(--destaque);font-weight:900;font-size:24px;letter-spacing:.14em;padding:8px 14px;">PINBALL WIZARD</div></div>
  <div style="position:absolute;top:170px;left:60px;${BS}font-size:420px;line-height:.85;">0</div>
  ${txt("vezes que o Eddie tinha tocado Pinball Wizard inteira ao vivo antes de hoje, solo ou com o Pearl Jam.", 560, 46)}
  <div style="position:absolute;top:840px;left:72px;right:72px;font-weight:800;font-size:34px;line-height:1.25;">
    <div style="padding:18px 0;border-top:4px solid var(--fundo);"><b style="font-weight:900;">2020:</b> um trechinho dentro de Far Behind, num show solo.</div>
    <div style="padding:18px 0;border-top:4px solid var(--fundo);"><b style="font-weight:900;">2025:</b> uma provocação do Pearl Jam em Pittsburgh, no parabéns pro Pete Townshend.</div></div>
  <div style="position:absolute;bottom:40px;left:72px;right:72px;display:flex;justify-content:space-between;font-weight:800;font-size:26px;"><div>@smufdpj</div><div>Fonte: setlist.fm · <span style="${BS}font-size:30px;">03/${TOTAL}</span></div></div></div>`);

slides.push(foto(4, "roger.jpg", "50% 30%", 640, `
  <div style="position:absolute;top:72px;left:72px;">${tag("THE KIDS ARE ALRIGHT")}</div>
  <div style="position:absolute;top:540px;left:72px;right:72px;">
    ${numero("36", "vezes que o Eddie já cantou, somando o solo e o Pearl Jam")}
    ${numero("1993", "estreia com o Pearl Jam, em Montreal")}
    ${numero("2025", "a outra vez com o próprio Roger, em Los Angeles")}</div>`, "Fonte: setlist.fm"));

slides.push(foto(5, "q1.0.jpg", "50% 25%", 600, `
  <div style="position:absolute;top:72px;left:72px;">${tag("OS DOIS JUNTOS")}</div>
  <div style="position:absolute;top:500px;left:64px;right:40px;">${tit("12ª vez no mesmo palco", 110)}</div>
  ${txt("De Chicago em 1999 a Los Angeles em 2025, foram 11 encontros com The Real Me, Baba O'Riley, The Punk and the Godfather e outras.", 760, 38)}
  ${txt("E é a primeira vez que o Eddie sobe no show do Roger num festival em que ele mesmo toca em outro dia.", 990, 38)}`, "Fonte: setlist.fm"));

slides.push(`<div data-screen-label="slide-06" style="${S}background:var(--fundo);color:var(--claro);">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("O PALPITE")}${tit("Rola ou não rola?", 150)}</div>
  ${txt("Dia 18 a gente perguntou se o Eddie ia subir com o Roger no sábado. Pelas contas, 11 de 14 encontros dos dois tinham virado palco junto: 79%.", 560, 42)}
  <div style="position:absolute;top:900px;left:72px;right:72px;background:var(--destaque);color:var(--fundo);padding:22px 28px;font-weight:900;font-size:40px;">Quem comentou SIM, acertou.</div>
  ${rodape(6)}</div>`);

slides.push(`<div data-screen-label="slide-07" style="${S}background:var(--fundo);color:var(--claro);">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("AMANHÃ")}${tit("Tem Eddie de novo", 150)}</div>
  ${txt("Domingo é a segunda noite do Eddie no Ibirapuera. Será que o Roger retribui a visita?", 640, 46)}
  <div style="position:absolute;top:900px;left:72px;right:72px;background:var(--destaque);color:var(--fundo);padding:22px 28px;font-weight:900;font-size:34px;">O reel de hoje tá no perfil. A cobertura segue aqui.</div>
  ${rodape(7)}</div>`);

const html = `<!DOCTYPE html>
<!-- Gerado por reels-especiais/eddie-roger-carrossel/gera.mjs (não editar à mão). Modelo: media/carrossel/ranking/modelo.html -->
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
console.log("design/carrossel.html:", slides.length, "slides");
