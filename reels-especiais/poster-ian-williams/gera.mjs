// Gera design/carrossel.html: "O pôster de SP, detalhe por detalhe" (arte de @ianwilliamsart, show de 20/11/2026).
// Modelo do ranking (Claude Design), paleta laranja. Pôster (768x1024) fica fora do git, em design/uploads/poster.png.
// Uso: node reels-especiais/poster-ian-williams/gera.mjs && node scripts/publish/carrossel/render.mjs \
//        reels-especiais/poster-ian-williams/design/carrossel.html reels-especiais/poster-ian-williams/saida laranja
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const TOTAL = 8;
const PW = 768, PH = 1024; // tamanho do pôster
const BS = "font-family:'Big Shoulders Display',sans-serif;font-weight:900;";
const S = "width:1080px;height:1350px;position:relative;overflow:hidden;flex:none;";
const rodape = (n) => `
  <div style="position:absolute;bottom:40px;left:72px;right:72px;display:flex;align-items:center;justify-content:space-between;color:var(--claro);">
    <div style="display:flex;align-items:center;gap:14px;"><div style="width:62px;height:62px;border-radius:50%;overflow:hidden;border:3px solid var(--destaque);background:var(--papel);"><img src="uploads/selo-smufdpj.jpg" alt="selo" style="width:100%;height:100%;object-fit:cover;transform:scale(1.1);"></div><div style="font-weight:800;font-size:26px;">@smufdpj</div></div>
    <div style="display:flex;align-items:center;gap:22px;font-weight:700;font-size:22px;"><div>Arte: @ianwilliamsart</div><div style="${BS}font-size:30px;color:var(--destaque);">${String(n).padStart(2, "0")}/${TOTAL}</div></div>
  </div>`;
const tag = (txt) => `<div style="display:inline-block;background:var(--destaque);color:var(--fundo);font-weight:900;font-size:24px;letter-spacing:.14em;padding:8px 14px;">${txt}</div>`;
// Lupa: recorte (x,y,w,h em px do pôster) mostrado com largura `larg`, moldura branca e leve giro
const lupa = (x, y, w, h, larg, rot = 0, num = "") => {
  const k = larg / w, alt = Math.round(h * k);
  return `<div style="position:relative;background:var(--claro);padding:12px;transform:rotate(${rot}deg);box-shadow:0 18px 44px rgba(0,0,0,.5);width:${larg}px;">
  <div style="width:${larg}px;height:${alt}px;background:url(uploads/poster.png) no-repeat;background-size:${PW * k}px ${PH * k}px;background-position:${-x * k}px ${-y * k}px;"></div>
  ${num ? `<div style="position:absolute;top:-26px;left:-26px;width:76px;height:76px;border-radius:50%;background:var(--alerta);color:var(--claro);display:flex;align-items:center;justify-content:center;${BS}font-size:46px;">${num}</div>` : ""}</div>`;
};
const titulo = (t, tam = 130) => `<div style="margin-top:18px;${BS}font-size:${tam}px;line-height:.88;text-transform:uppercase;letter-spacing:-2px;color:var(--destaque);">${t}</div>`;
const texto = (t) => `<div style="font-weight:800;font-size:38px;line-height:1.22;">${t}</div>`;
const fundo = `${S}background:var(--fundo);color:var(--claro);`;

const slides = [];

slides.push(`<div data-screen-label="slide-01" style="${fundo}">
  <div style="position:absolute;top:60px;left:72px;">${tag("SÓ EXISTE EM SÃO PAULO")}</div>
  <div style="position:absolute;top:140px;left:290px;">${lupa(0, 0, PW, PH, 500, 2.5)}</div>
  <div style="position:absolute;top:880px;left:64px;right:64px;${BS}font-size:110px;line-height:.88;text-transform:uppercase;color:var(--destaque);letter-spacing:-2px;">O pôster de hoje, detalhe por detalhe</div>
  <div style="position:absolute;top:1100px;left:64px;right:64px;font-weight:800;font-size:34px;line-height:1.2;">O Ian Williams desenhou São Paulo inteira no pôster do Eddie no Ibirapuera. A gente abriu a lupa.</div>
  <div style="position:absolute;bottom:42px;right:64px;${BS}font-size:44px;color:var(--destaque);letter-spacing:2px;">ARRASTA →</div>
  <div style="position:absolute;bottom:54px;left:64px;font-size:20px;font-weight:700;color:rgba(255,255,255,.7);">Arte: @ianwilliamsart</div>
</div>`);

slides.push(`<div data-screen-label="slide-02" style="${fundo}">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("1 · O LETREIRO")}${titulo("Cara de anos 70")}</div>
  <div style="position:absolute;top:400px;left:72px;">${lupa(0, 20, PW, 270, 912, -1.5, "1")}</div>
  <div style="position:absolute;top:800px;left:72px;right:72px;">${texto("O nome vem em letras de linhas paralelas, o contorno repetido por dentro, como nas capas de disco e nos carros de corrida dos anos 70.")}<div style="height:26px"></div>${texto("Branco puro em cima de um céu roxo que vira laranja de pôr do sol.")}</div>
  ${rodape(2)}
</div>`);

slides.push(`<div data-screen-label="slide-03" style="${fundo}">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("2 · O MOTOBOY")}${titulo("Show com entrega")}</div>
  <div style="position:absolute;top:380px;left:60px;">${lupa(110, 300, 450, 360, 560, -2, "2")}</div>
  <div style="position:absolute;top:400px;left:660px;">${lupa(140, 395, 120, 110, 360, 3)}</div>
  <div style="position:absolute;top:780px;left:660px;right:56px;font-weight:800;font-size:28px;line-height:1.2;color:var(--destaque);">A escalação da noite escrita no baú</div>
  <div style="position:absolute;top:950px;left:72px;right:72px;">${texto("Quem segura o pôster é um motoboy de baú nas costas, a figura mais paulistana que existe, empinando a moto no meio do mato.")}<div style="height:22px"></div>${texto("No baú: 20 de novembro de 2026, Simon Townshend, Linka Moja e Samuel Rosa.")}</div>
  ${rodape(3)}
</div>`);

slides.push(`<div data-screen-label="slide-04" style="${fundo}">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("3 · OS PEIXES")}${titulo("Peixe dourado voando")}</div>
  <div style="position:absolute;top:420px;left:70px;">${lupa(0, 330, 170, 120, 420, -3, "3")}</div>
  <div style="position:absolute;top:400px;left:560px;">${lupa(250, 555, 250, 140, 450, 2.5)}</div>
  <div style="position:absolute;top:820px;left:72px;right:72px;">${texto("Dois peixes dourados brilham no ar, um atrás do motoboy e outro passando na frente da moto.")}<div style="height:22px"></div>${texto("Lembram as carpas do lago do Ibirapuera, bem ali do lado do palco.")}</div>
  ${rodape(4)}
</div>`);

slides.push(`<div data-screen-label="slide-05" style="${fundo}">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("4 · A CAPIVARA")}${titulo("Ela não podia faltar")}</div>
  <div style="position:absolute;top:400px;left:220px;">${lupa(470, 720, 280, 250, 640, -1.5, "4")}</div>
  <div style="position:absolute;top:1080px;left:72px;right:72px;">${texto("Uma capivara dourada caminha pela beira d'água no canto do pôster. É a moradora mais famosa dos rios e parques da cidade.")}</div>
  ${rodape(5)}
</div>`);

slides.push(`<div data-screen-label="slide-06" style="${fundo}">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("5 · A CIDADE")}${titulo("Concreto e mato")}</div>
  <div style="position:absolute;top:390px;left:70px;">${lupa(0, 500, 200, 160, 430, -2, "5")}</div>
  <div style="position:absolute;top:380px;left:580px;">${lupa(620, 0, 148, 180, 380, 2.5)}</div>
  <div style="position:absolute;top:1000px;left:72px;right:72px;">${texto("De um lado, prédios com janelas acesas. Do outro, linhas verdes saindo de um mastro, com cara dos cabos da Ponte Estaiada.")}<div style="height:20px"></div>${texto("No meio de tudo, folhagem azul e capim alto.")}</div>
  ${rodape(6)}
</div>`);

slides.push(`<div data-screen-label="slide-07" style="${fundo}">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("QUEM DESENHOU")}${titulo("Ian Williams", 150)}</div>
  <div style="position:absolute;top:330px;left:72px;right:72px;">${texto("É dele a arte de vários pôsteres do Pearl Jam e do Eddie, como o de Fenway em 2018 e o do Eddie em Berlim em 2019. Em outros, ele assina a direção de arte.")}</div>
  <div style="position:absolute;top:640px;left:72px;">${lupa(500, 940, 268, 84, 600, -1.5)}</div>
  <div style="position:absolute;top:880px;left:72px;right:72px;background:var(--destaque);color:var(--fundo);padding:26px 30px;">
    <div style="font-weight:900;font-size:40px;line-height:1.15;">Faz parte dos produtos oficiais do show</div>
    <div style="margin-top:10px;font-weight:800;font-size:30px;line-height:1.25;">Na banca do merch no Ibirapuera, hoje das 14h às 22h.</div></div>
  ${rodape(7)}
</div>`);

slides.push(`<div data-screen-label="slide-08" style="${fundo}">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("E VOCÊ?")}${titulo("Qual detalhe você não tinha visto?", 150)}</div>
  <div style="position:absolute;top:760px;left:72px;right:72px;font-weight:900;font-size:46px;line-height:1.15;">Comenta e marca quem vai sair do Ibirapuera com o pôster debaixo do braço.</div>
  <div style="position:absolute;top:1010px;left:72px;right:72px;background:var(--destaque);color:var(--fundo);padding:22px 28px;font-weight:900;font-size:34px;line-height:1.15;">Arte original de @ianwilliamsart. Segue ele.</div>
  ${rodape(8)}
</div>`);

const html = `<!DOCTYPE html>
<!-- Gerado por reels-especiais/poster-ian-williams/gera.mjs (não editar à mão). Modelo: media/carrossel/ranking/modelo.html -->
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
