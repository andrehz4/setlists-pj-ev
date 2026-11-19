// Gera design/carrossel.html: "Merch oficial do Eddie em SP" (preços do folheto divulgado pela @mrtsurt em 19/11).
// Modelo do ranking (Claude Design), paleta azul. Capa com a foto do folheto (@mrtsurt, creditada); foto fica fora do git.
// Uso: node reels-especiais/merch-ibirapuera/gera.mjs && node scripts/publish/carrossel/render.mjs \
//        reels-especiais/merch-ibirapuera/design/carrossel.html reels-especiais/merch-ibirapuera/saida azul
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const TOTAL = 5;
const BS = "font-family:'Big Shoulders Display',sans-serif;font-weight:900;";
const S = "width:1080px;height:1350px;position:relative;overflow:hidden;flex:none;";
const PONT = "background-color:var(--destaque);background-image:radial-gradient(rgba(0,0,0,.08) 1.2px,transparent 1.6px);background-size:10px 10px;";
const rodape = (n, claro = false) => `
  <div style="position:absolute;bottom:40px;left:72px;right:72px;display:flex;align-items:center;justify-content:space-between;color:${claro ? "var(--fundo)" : "var(--claro)"};">
    <div style="display:flex;align-items:center;gap:14px;"><div style="width:62px;height:62px;border-radius:50%;overflow:hidden;border:3px solid ${claro ? "var(--fundo)" : "var(--destaque)"};background:var(--papel);"><img src="uploads/selo-smufdpj.jpg" alt="selo" style="width:100%;height:100%;object-fit:cover;transform:scale(1.1);"></div><div style="font-weight:800;font-size:26px;">@smufdpj</div></div>
    <div style="display:flex;align-items:center;gap:22px;font-weight:700;font-size:22px;"><div>somaisumfadepearljam.com.br</div><div style="${BS}font-size:30px;color:${claro ? "var(--fundo)" : "var(--destaque)"};">${String(n).padStart(2, "0")}/${TOTAL}</div></div>
  </div>`;
const tag = (txt, claro) => `<div style="display:inline-block;background:${claro ? "var(--fundo)" : "var(--destaque)"};color:${claro ? "var(--destaque)" : "var(--fundo)"};font-weight:900;font-size:24px;letter-spacing:.14em;padding:8px 14px;">${txt}</div>`;
// Linha de preço: nome à esquerda, valor grande à direita
const precos = (itens, cor) => itens.map(([nome, obs, valor]) => `<div style="display:flex;align-items:center;justify-content:space-between;gap:24px;padding:24px 0;border-top:4px solid ${cor};">
  <div><div style="font-weight:900;font-size:44px;line-height:1.08;">${nome}</div>${obs ? `<div style="margin-top:6px;font-weight:700;font-size:26px;opacity:.8;">${obs}</div>` : ""}</div>
  <div style="${BS}font-size:96px;line-height:.9;white-space:nowrap;">${valor}</div></div>`).join("");

const slides = [];

slides.push(`<div data-screen-label="slide-01" style="${S}background:var(--fundo);color:var(--claro);">
  <img src="uploads/folheto.png" alt="Folheto dos produtos oficiais do Eddie Vedder em São Paulo" style="position:absolute;top:0;left:0;width:1080px;height:860px;object-fit:cover;object-position:50% 35%;">
  <div style="position:absolute;top:0;left:0;width:1080px;height:880px;background:linear-gradient(180deg,rgba(8,17,26,.55) 0%,rgba(8,17,26,0) 22%,rgba(8,17,26,0) 45%,var(--fundo) 96%);"></div>
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("EDDIE VEDDER · SÃO PAULO")}</div>
  <div style="position:absolute;top:560px;left:64px;right:40px;${BS}font-size:160px;line-height:.86;color:var(--destaque);letter-spacing:-3px;text-transform:uppercase;text-shadow:0 6px 30px rgba(0,0,0,.6);">Quanto custa o merch?</div>
  <div style="position:absolute;top:860px;left:56px;transform:rotate(-4deg);background:var(--alerta);color:var(--claro);padding:12px 26px 8px;${BS}font-size:60px;line-height:1;letter-spacing:2px;box-shadow:0 0 0 5px var(--alerta),0 0 0 9px var(--claro),0 18px 40px rgba(0,0,0,.45);">DE R$ 150 A R$ 400</div>
  <div style="position:absolute;top:990px;left:64px;right:64px;font-weight:900;font-size:40px;line-height:1.12;">Saiu o folheto dos produtos oficiais do Ibirapuera. A gente passou a limpo.</div>
  <div style="position:absolute;top:1130px;left:0;width:1080px;height:80px;background:var(--destaque);color:var(--fundo);display:flex;align-items:center;padding:0 64px;font-weight:900;font-size:32px;">Pra ir com o dinheiro contado.</div>
  <div style="position:absolute;bottom:42px;right:64px;${BS}font-size:44px;color:var(--destaque);letter-spacing:2px;">ARRASTA →</div>
  <div style="position:absolute;bottom:54px;left:64px;font-size:18px;font-weight:600;color:rgba(255,255,255,.6);">Foto e fonte: @mrtsurt</div>
</div>`);

// Cartão com o recorte do produto (design/uploads/item-*.jpg, gerado por recorta.py)
const cartao = (img, alt, w, h, rot) => `<div style="background:var(--claro);padding:12px;transform:rotate(${rot}deg);box-shadow:0 16px 40px rgba(0,0,0,.35);"><img src="uploads/item-${img}.jpg" alt="${alt}" style="display:block;width:${w}px;height:${h}px;object-fit:cover;"></div>`;

slides.push(`<div data-screen-label="slide-02" style="${S}${PONT}color:var(--fundo);">
  <div style="position:absolute;top:72px;left:72px;right:72px;display:flex;align-items:flex-end;justify-content:space-between;">
    <div>${tag("CAMISETAS", true)}<div style="margin-top:18px;${BS}font-size:190px;line-height:.9;letter-spacing:-4px;">R$ 200</div></div>
    <div style="font-weight:900;font-size:40px;text-align:right;line-height:1.1;padding-bottom:18px;">cada uma,<br>qualquer modelo</div></div>
  <div style="position:absolute;top:380px;left:72px;right:72px;display:grid;grid-template-columns:1fr 1fr;gap:34px 36px;">
    ${[["samba", "Samba Mod", -1.5], ["skyline", "SP Skyline", 1.2], ["cocar", "Estampa de cocar", 1], ["surf", "Surf na calçada", -1.2]].map(([img, nome, rot]) => `<div>${cartao(img, "Camiseta " + nome, 444, 300, rot)}<div style="margin-top:14px;font-weight:900;font-size:36px;">${nome}</div></div>`).join("")}
  </div>
  <div style="position:absolute;top:1190px;left:72px;right:72px;font-weight:800;font-size:28px;">Tem mais uma estampa no folheto. Unissex, do P ao 3GG.</div>
  ${rodape(2, true)}
</div>`);

slides.push(`<div data-screen-label="slide-03" style="${S}background:var(--fundo);color:var(--claro);">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("O RESTO DA BANCA")}
    <div style="margin-top:18px;${BS}font-size:96px;line-height:.9;text-transform:uppercase;letter-spacing:-1px;color:var(--destaque);white-space:nowrap;">Moletom, boné e Zippo</div></div>
  <div style="position:absolute;top:300px;left:72px;right:72px;display:flex;flex-direction:column;gap:34px;">
    ${[["moletom", "Moletom com zíper", "unissex, P ao 3GG", "R$ 400", -1.5], ["bone", "Boné Samba Mod", "tamanho único", "R$ 150", 1.2], ["zippo", "Isqueiro Zippo", "GH São Paulo, com limite por pessoa", "R$ 250", -1]].map(([img, nome, obs, valor, rot]) => `<div style="display:flex;align-items:center;gap:44px;">${cartao(img, nome, 270, 262, rot)}
      <div><div style="${BS}font-size:120px;line-height:.9;color:var(--destaque);">${valor}</div><div style="margin-top:10px;font-weight:900;font-size:42px;">${nome}</div><div style="margin-top:4px;font-weight:700;font-size:26px;opacity:.75;">${obs}</div></div></div>`).join("")}
  </div>
  ${rodape(3)}
</div>`);

slides.push(`<div data-screen-label="slide-04" style="${S}${PONT}color:var(--fundo);">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("ANTES DE PAGAR", true)}
    <div style="margin-top:22px;${BS}font-size:180px;line-height:.84;text-transform:uppercase;letter-spacing:-2px;">Confere na hora</div></div>
  <div style="position:absolute;top:520px;left:72px;right:72px;">${[
    ["Olha a peça ali no balcão", "Defeito, tamanho, estampa. Depois não tem como."],
    ["Venda definitiva", "O próprio folheto avisa: não tem troca."],
    ["Merch oficial é na banca do show", "Camisa com o nome do Eddie em outro lugar não é dessa linha."],
  ].map(([t, d]) => `<div style="padding:24px 0;border-top:4px solid var(--fundo);"><div style="font-weight:900;font-size:50px;line-height:1.1;">${t}</div><div style="margin-top:8px;font-weight:700;font-size:32px;line-height:1.25;opacity:.85;">${d}</div></div>`).join("")}</div>
  ${rodape(4, true)}
</div>`);

slides.push(`<div data-screen-label="slide-05" style="${S}background:var(--fundo);color:var(--claro);">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("E VOCÊ?")}
    <div style="margin-top:22px;${BS}font-size:165px;line-height:.95;text-transform:uppercase;letter-spacing:-2px;color:var(--destaque);">Qual vai pra casa com você?</div></div>
  <div style="position:absolute;top:720px;left:72px;right:72px;font-weight:900;font-size:48px;line-height:1.15;">Comenta qual você vai levar e marca quem vai junto no Ibirapuera.</div>
  <div style="position:absolute;top:1000px;left:72px;right:72px;background:var(--destaque);color:var(--fundo);padding:22px 28px;font-weight:900;font-size:36px;line-height:1.15;">Salva o post pra ter os preços na fila.</div>
  ${rodape(5)}
</div>`);

const html = `<!DOCTYPE html>
<!-- Gerado por reels-especiais/merch-ibirapuera/gera.mjs (não editar à mão). Modelo: media/carrossel/ranking/modelo.html -->
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
