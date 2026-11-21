// Gera design/carrossel.html: "Eddie e Glen", a amizade do Eddie Vedder com o Glen Hansard, do telefonema de 2010
// ao Ibirapuera. Capa = foto da bandeira de @msachno (creditada). Fotos em design/uploads, fora do git.
// Uso: node reels-especiais/eddie-glen/gera.mjs && node scripts/publish/carrossel/render.mjs \
//        reels-especiais/eddie-glen/design/carrossel.html reels-especiais/eddie-glen/saida laranja
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const TOTAL = 9;
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
const ano = (a) => `<div style="${BS}font-size:230px;line-height:.8;color:var(--claro);opacity:.12;position:absolute;top:60px;right:50px;">${a}</div>`;
// Slide de texto puro: ano gigante ao fundo, tag, título e dois parágrafos
const capitulo = (n, a, tg, t, p1, p2, fonte = "") => `<div data-screen-label="slide-${String(n).padStart(2, "0")}" style="${S}background:var(--fundo);color:var(--claro);">
  ${ano(a)}
  <div style="position:absolute;top:300px;left:72px;right:72px;">${tag(tg)}${tit(t, 112)}</div>
  ${txt(p1, 720)}${txt(p2, 960)}${rodape(n, fonte)}</div>`;

const slides = [];
slides.push(`<div data-screen-label="slide-01" style="${S}background:var(--fundo);color:var(--claro);">
  <img src="uploads/bandeira.jpg" alt="Eddie Vedder olha a bandeira do Brasil com o rosto dele e do Glen Hansard" style="position:absolute;top:0;left:0;width:1080px;height:960px;object-fit:cover;object-position:50% 40%;">
  <div style="position:absolute;top:0;left:0;width:1080px;height:980px;background:linear-gradient(180deg,rgba(20,17,15,.6) 0%,rgba(20,17,15,0) 20%,rgba(20,17,15,0) 70%,var(--fundo) 99%);"></div>
  <div style="position:absolute;top:72px;left:72px;">${tag("UMA AMIZADE")}</div>
  <div style="position:absolute;top:880px;left:64px;right:40px;${BS}font-size:150px;line-height:.86;letter-spacing:-3px;text-transform:uppercase;">Eddie<br><span style="color:var(--destaque);">e Glen</span></div>
  ${txt("Começou com um telefonema e foi até o fim.", 1170, 36)}
  <div style="position:absolute;top:900px;right:64px;font-weight:700;font-size:22px;opacity:.85;">Foto: @msachno</div>
  ${rodape(1)}</div>`);

slides.push(capitulo(2, "2007", "QUEM ERA O GLEN", "O garoto da Grafton Street",
  "Glen Hansard começou cantando na rua em Dublin, ainda adolescente, na Grafton Street. Depois veio a banda The Frames.",
  "Em 2007 ele estrelou o filme Once. Com Markéta Irglová, levou o Oscar de canção original por Falling Slowly."));

slides.push(capitulo(3, "2010", "AGOSTO DE 2010", "O telefonema",
  "Em 19 de agosto de 2010, um fã morreu durante um show do Glen na Califórnia. Os dois nunca tinham se falado.",
  "O Eddie, que viveu a tragédia de Roskilde em 2000 com o Pearl Jam, ligou pra saber como ele estava. Ligou de novo por cinco dias seguidos."));

slides.push(capitulo(4, "2011", "SEATTLE", "Se passar por Seattle, me liga",
  "No fim das ligações, o Eddie deixou o número. Meses depois, o Glen passou por Seattle com o The Frames e os dois se encontraram no estúdio.",
  "Dali saiu Sleepless Nights, cantada a dois, que entrou no Ukulele Songs, disco solo do Eddie de 2011."));

slides.push(capitulo(5, "2022", "NA ESTRADA", "Dez anos lado a lado",
  "O Glen abriu as turnês solo do Eddie várias vezes, em 2011, 2012, 2014, 2017 e 2019. Muitas noites terminavam com os dois juntos no palco.",
  "Em 2022 foi além: abriu os shows e tocou na banda do Eddie, os Earthlings, na turnê do disco Earthling."));

slides.push(capitulo(6, "2024", "SONG OF GOOD HOPE", "A música que o Eddie adotou",
  "Song of Good Hope é do Glen, do disco Rhythm and Repose, de 2012. O Eddie passou a tocar nos shows solo, umas duas dezenas de vezes.",
  "Em agosto de 2024, em Indiana, os dois cantaram juntos num show do Pearl Jam, por um fã que lutava contra o câncer. Foi a estreia dela com a banda.", "Fonte: setlist.fm"));

slides.push(capitulo(7, "2026", "29 DE JULHO DE 2026", "A despedida",
  "O Glen morreu depois de um acidente de moto. O funeral foi em 4 de agosto, na Catedral de São Patrício, em Dublin.",
  "O Eddie cantou Song of Good Hope ao lado da Markéta Irglová, a parceira de Once."));

slides.push(capitulo(8, "2026", "DE VOLTA À RUA", "Black na Grafton Street",
  "Depois do funeral, o Eddie foi pra Grafton Street, a rua onde o Glen começou, e tocou ali como músico de rua.",
  "No repertório, Drive All Night, do Springsteen, e Black."));

slides.push(`<div data-screen-label="slide-09" style="${S}background:var(--fundo);color:var(--claro);">
  <img src="uploads/violao.jpg" alt="Eddie Vedder no Ibirapuera" style="position:absolute;top:0;left:0;width:1080px;height:700px;object-fit:cover;object-position:50% 35%;">
  <div style="position:absolute;top:0;left:0;width:1080px;height:720px;background:linear-gradient(180deg,rgba(20,17,15,.55) 0%,rgba(20,17,15,0) 25%,rgba(20,17,15,0) 55%,var(--fundo) 98%);"></div>
  <div style="position:absolute;top:72px;left:72px;">${tag("IBIRAPUERA")}</div>
  <div style="position:absolute;top:600px;left:64px;right:40px;">${tit("E chegou em São Paulo", 110)}</div>
  ${txt("No Ibirapuera, o Eddie tocou Song of Good Hope pro amigo e falou de deixar ir quem a gente ama. Quando a galera pediu Black, ele atendeu.", 840, 38)}
  ${txt("Duas músicas que, depois deste ano, carregam o Glen junto.", 1080, 38)}
  ${rodape(9)}</div>`);

const html = `<!DOCTYPE html>
<!-- Gerado por reels-especiais/eddie-glen/gera.mjs (não editar à mão). Modelo: media/carrossel/ranking/modelo.html -->
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><script src="./support.js"></script></head>
<body><x-dc><helmet>
<meta name="design_doc_mode" content="canvas">
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Archivo:wght@500;700;800;900&display=swap" rel="stylesheet">
<style>:root{--destaque:#FFCC1A;--fundo:#14110F;--alerta:#E0361C;--papel:#f3efe6;--papel2:#E9E1CF;--claro:#fff;}body{margin:0;background:#1c1c1c;}</style>
</helmet>
<section style="display:flex;flex-wrap:wrap;gap:64px;padding:80px;align-items:flex-start;font-family:'Archivo',sans-serif;">
${slides.join("\n")}
</section></x-dc></body></html>`;
fs.mkdirSync(path.join(dir, "design"), { recursive: true });
fs.writeFileSync(path.join(dir, "design", "carrossel.html"), html);
console.log("design/carrossel.html:", slides.length, "slides");
