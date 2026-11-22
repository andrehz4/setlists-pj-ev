// Gera design/carrossel.html: "O pôster da 2ª noite, detalhe por detalhe" (arte de @munk_one, show de 22/11/2026).
// Modelo do ranking (Claude Design), paleta laranja. Pôster (800x1054, recortado do post da @mrtsurt) fica fora do git, em design/uploads/poster.png.
// Uso: node reels-especiais/poster-munk-one/gera.mjs && node scripts/publish/carrossel/render.mjs \
//        reels-especiais/poster-munk-one/design/carrossel.html reels-especiais/poster-munk-one/saida laranja
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const TOTAL = 8;
const PW = 800, PH = 1054; // tamanho do pôster
const BS = "font-family:'Big Shoulders Display',sans-serif;font-weight:900;";
const S = "width:1080px;height:1350px;position:relative;overflow:hidden;flex:none;";
const rodape = (n) => `
  <div style="position:absolute;bottom:40px;left:72px;right:72px;display:flex;align-items:center;justify-content:space-between;color:var(--claro);">
    <div style="display:flex;align-items:center;gap:14px;"><div style="width:62px;height:62px;border-radius:50%;overflow:hidden;border:3px solid var(--destaque);background:var(--papel);"><img src="uploads/selo-smufdpj.jpg" alt="selo" style="width:100%;height:100%;object-fit:cover;transform:scale(1.1);"></div><div style="font-weight:800;font-size:26px;">@smufdpj</div></div>
    <div style="display:flex;align-items:center;gap:22px;font-weight:700;font-size:22px;"><div>Arte: @munk_one</div><div style="${BS}font-size:30px;color:var(--destaque);">${String(n).padStart(2, "0")}/${TOTAL}</div></div>
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
  <div style="position:absolute;top:60px;left:72px;">${tag("2ª NOITE · SÓ EXISTE EM SP")}</div>
  <div style="position:absolute;top:140px;left:300px;">${lupa(0, 0, PW, PH, 480, 2.5)}</div>
  <div style="position:absolute;top:870px;left:64px;right:64px;${BS}font-size:110px;line-height:.88;text-transform:uppercase;color:var(--destaque);letter-spacing:-2px;">O pôster de hoje, detalhe por detalhe</div>
  <div style="position:absolute;top:1090px;left:64px;right:64px;font-weight:800;font-size:34px;line-height:1.2;">Na 2ª noite do Eddie no Ibirapuera, quem desenhou foi o Munk One. Um cervo gigante atravessa a cidade. A gente abriu a lupa.</div>
  <div style="position:absolute;bottom:42px;right:64px;${BS}font-size:44px;color:var(--destaque);letter-spacing:2px;">ARRASTA →</div>
  <div style="position:absolute;bottom:54px;left:64px;font-size:20px;font-weight:700;color:rgba(255,255,255,.7);">Arte: @munk_one</div>
</div>`);

slides.push(`<div data-screen-label="slide-02" style="${fundo}">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("1 · O CERVO")}${titulo("Chifre que vira jardim")}</div>
  <div style="position:absolute;top:410px;left:72px;">${lupa(100, 0, 700, 330, 912, -1.5, "1")}</div>
  <div style="position:absolute;top:900px;left:72px;right:72px;">${texto("O centro do pôster é um cervo azul enorme. Os chifres viram galhos cheios de flores e de raízes penduradas.")}<div style="height:24px"></div>${texto("Na testa, uma chama vermelha. No corpo, losangos vermelhos riscados.")}</div>
  ${rodape(2)}
</div>`);

slides.push(`<div data-screen-label="slide-03" style="${fundo}">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("2 · A PONTE")}${titulo("Ela de novo")}</div>
  <div style="position:absolute;top:380px;left:330px;">${lupa(0, 40, 220, 380, 340, -2, "2")}</div>
  <div style="position:absolute;top:1030px;left:72px;right:72px;">${texto("No canto esquerdo, o mastro e os cabos da Ponte Estaiada. Ela já tinha aparecido no pôster de sexta. Pelo visto, é o cartão-postal que os gringos escolheram pra SP.")}</div>
  ${rodape(3)}
</div>`);

slides.push(`<div data-screen-label="slide-04" style="${fundo}">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("3 · OS PEIXES")}${titulo("Peixe dourado no ar")}</div>
  <div style="position:absolute;top:420px;left:70px;">${lupa(600, 250, 180, 190, 420, -3, "3")}</div>
  <div style="position:absolute;top:430px;left:580px;">${lupa(30, 510, 170, 130, 400, 2.5)}</div>
  <div style="position:absolute;top:950px;left:72px;right:72px;">${texto("Peixes dourados nadam no céu, em volta do cervo e do letreiro.")}<div style="height:22px"></div>${texto("Coincidência boa: o pôster de sexta, de outro artista, também tinha peixe dourado voando. As carpas do lago do Ibirapuera viraram tema.")}</div>
  ${rodape(4)}
</div>`);

slides.push(`<div data-screen-label="slide-05" style="${fundo}">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("4 · A CIDADE")}${titulo("Prédio no meio do mato")}</div>
  <div style="position:absolute;top:400px;left:200px;">${lupa(540, 400, 240, 200, 680, -1.5, "4")}</div>
  <div style="position:absolute;top:1040px;left:72px;right:72px;">${texto("Atrás do cervo, prédios verdes aparecem entre as árvores. É o skyline em volta do parque, engolido pela mata.")}</div>
  ${rodape(5)}
</div>`);

slides.push(`<div data-screen-label="slide-05b" style="${fundo}">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("5 · O CHÃO")}${titulo("Capim que acende")}</div>
  <div style="position:absolute;top:400px;left:72px;">${lupa(80, 640, 700, 300, 912, 1.5, "5")}</div>
  <div style="position:absolute;top:880px;left:72px;right:72px;">${texto("Onde o cervo pisa, o capim brilha em verde-limão. Um caminho amarelo corta o pôster de ponta a ponta.")}<div style="height:22px"></div>${texto("E florzinhas amarelas por toda parte, como as do parque nessa época.")}</div>
  ${rodape(6)}
</div>`);

slides.push(`<div data-screen-label="slide-07" style="${fundo}">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("QUEM DESENHOU")}${titulo("Munk One", 150)}</div>
  <div style="position:absolute;top:330px;left:72px;right:72px;">${texto("Artista da Califórnia, faz pôster de show desde 2009 e fundou a Invisible Industries, que produz serigrafias em tiragem limitada. Também criou o Colour Haiku, festival de pôsteres em Los Angeles.")}</div>
  <div style="position:absolute;top:640px;left:72px;">${lupa(40, 470, 480, 300, 480, -1.5)}</div>
  <div style="position:absolute;top:1010px;left:72px;right:72px;background:var(--destaque);color:var(--fundo);padding:24px 30px;">
    <div style="font-weight:900;font-size:38px;line-height:1.15;">Na banca do merch do Ibirapuera</div>
    <div style="margin-top:8px;font-weight:800;font-size:28px;line-height:1.25;">Limite de 2 pôsteres por pessoa. Aceita dinheiro e cartão.</div></div>
  ${rodape(7)}
</div>`);

slides.push(`<div data-screen-label="slide-08" style="${fundo}">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("E VOCÊ?")}${titulo("Sexta ou domingo: qual pôster é o seu?", 140)}</div>
  <div style="position:absolute;top:760px;left:72px;right:72px;font-weight:900;font-size:46px;line-height:1.15;">Comenta e marca quem vai sair do Ibirapuera com os dois debaixo do braço.</div>
  <div style="position:absolute;top:1010px;left:72px;right:72px;background:var(--destaque);color:var(--fundo);padding:22px 28px;font-weight:900;font-size:34px;line-height:1.15;">Arte original de @munk_one. Segue ele.</div>
  ${rodape(8)}
</div>`);

const html = `<!DOCTYPE html>
<!-- Gerado por reels-especiais/poster-munk-one/gera.mjs (não editar à mão). Modelo: media/carrossel/ranking/modelo.html -->
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
