// Gera design/carrossel.html (modelo do ranking, Claude Design) com os slides "Eddie sobe com o Roger?".
// Dados: pesquisa de 18/11/2026 (setlist.fm, JamBase, thewho.com). Fotos em design/uploads (fora do git).
// Uso: node reels-especiais/eddie-daltrey/gera.mjs && node scripts/publish/carrossel/render.mjs \
//        reels-especiais/eddie-daltrey/design/carrossel.html reels-especiais/eddie-daltrey/saida '<paleta json>'
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const TOTAL = 10;
const BS = "font-family:'Big Shoulders Display',sans-serif;font-weight:900;";
const S = (n) => `width:1080px;height:1350px;position:relative;overflow:hidden;flex:none;`;
const pontilhado = "background-color:var(--destaque);background-image:radial-gradient(rgba(0,0,0,.08) 1.2px,transparent 1.6px);background-size:10px 10px;";

// rodapé: escuro = selo com borda destaque; claro = tudo na cor do fundo
const rodape = (n, claro = false) => `
  <div style="position:absolute;bottom:40px;left:72px;right:72px;display:flex;align-items:center;justify-content:space-between;color:${claro ? "var(--fundo)" : "var(--claro)"};">
    <div style="display:flex;align-items:center;gap:14px;"><div style="width:62px;height:62px;border-radius:50%;overflow:hidden;border:3px solid ${claro ? "var(--fundo)" : "var(--destaque)"};background:var(--papel);"><img src="uploads/selo-smufdpj.jpg" alt="selo" style="width:100%;height:100%;object-fit:cover;transform:scale(1.1);"></div><div style="font-weight:800;font-size:26px;">@smufdpj</div></div>
    <div style="display:flex;align-items:center;gap:22px;font-weight:700;font-size:22px;"><div>somaisumfadepearljam.com.br</div><div style="${BS}font-size:30px;color:${claro ? "var(--fundo)" : "var(--destaque)"};">${String(n).padStart(2, "0")}/${TOTAL}</div></div>
  </div>`;

const VEZES = [
  ["1999", "Chicago", "Let's See Action"],
  ["2000", "Royal Albert Hall", "I'm One"],
  ["2009", "Seattle", "The Real Me + Better Man"],
  ["2014", "Londres", "Naked Eye"],
  ["2015", "Rosemont (EUA)", "The Real Me"],
  ["2016", "Los Angeles", "The Real Me"],
  ["2019", "Wembley", "The Punk and the Godfather"],
  ["2022", "Los Angeles", "The Seeker"],
  ["2024", "Royal Albert Hall", "The Punk and the Godfather"],
  ["2024", "Royal Albert Hall", "Baba O'Riley"],
  ["2025", "Los Angeles", "The Kids Are Alright"],
];
// Eddie solo + Pearl Jam somados (setlist.fm, stats de covers)
const WHO = [["Baba O'Riley", 201], ["The Kids Are Alright", 36], ["I'm One", 31], ["Love Reign O'er Me", 25],
  ["The Real Me", 25], ["I Can't Explain", 12], ["Blue Red and Grey", 9], ["My Generation", 9]];

const slides = [];

// 01 CAPA (arte de divulgação do próprio festival, uso liberado pelo Andre)
slides.push(`<div data-screen-label="slide-01" style="${S()}background:var(--fundo);color:var(--claro);">
  <img src="uploads/festival-eddie-roger.png" alt="Eddie Vedder e Roger Daltrey com violão, arte do festival" style="position:absolute;top:0;left:0;width:1080px;height:600px;object-fit:cover;object-position:50% 30%;">
  <div style="position:absolute;top:0;left:0;width:1080px;height:620px;background:linear-gradient(180deg,transparent 70%,var(--fundo) 99%);"></div>
  <div style="position:absolute;top:530px;left:56px;transform:rotate(-4deg);background:var(--alerta);color:var(--claro);padding:12px 26px 8px;${BS}font-size:60px;line-height:1;letter-spacing:2px;box-shadow:0 0 0 5px var(--alerta),0 0 0 9px var(--claro),0 18px 40px rgba(0,0,0,.45);">SÁBADO, 21/11</div>
  <div style="position:absolute;top:650px;left:60px;right:40px;${BS}font-size:124px;line-height:.86;color:var(--destaque);letter-spacing:-2px;text-transform:uppercase;">Eddie Vedder vai tocar com Roger no sábado?</div>
  <div style="position:absolute;top:1000px;left:64px;right:64px;font-weight:900;font-size:42px;line-height:1.08;letter-spacing:-.5px;">Roger Daltrey toca no Ibirapuera entre as duas noites do Eddie.</div>
  <div style="position:absolute;top:1160px;left:0;width:1080px;height:90px;background:var(--destaque);color:var(--fundo);display:flex;align-items:center;padding:0 64px;font-weight:900;font-size:34px;">26 anos de palco junto. A conta completa.</div>
  <div style="position:absolute;bottom:30px;right:64px;display:flex;align-items:center;gap:12px;${BS}font-size:44px;color:var(--destaque);letter-spacing:2px;">ARRASTA <span style="font-family:'Archivo',sans-serif;font-size:42px;">→</span></div>
  <div style="position:absolute;bottom:42px;left:64px;font-size:18px;font-weight:600;color:rgba(255,255,255,.6);">Arte: Best of Blues and Rock (divulgação)</div>
</div>`);

// 02 AS 11 VEZES
slides.push(`<div data-screen-label="slide-02" style="${S()}${pontilhado}color:var(--fundo);">
  <div style="position:absolute;top:64px;left:72px;right:72px;">
    <div style="display:flex;align-items:center;gap:14px;"><div style="background:var(--fundo);color:var(--destaque);font-weight:900;font-size:24px;letter-spacing:.14em;padding:8px 14px;">1999 A 2025</div><div style="font-weight:800;font-size:24px;letter-spacing:.14em;">NO MESMO PALCO</div></div>
    <div style="margin-top:18px;${BS}font-size:150px;line-height:.84;text-transform:uppercase;letter-spacing:-2px;">11 vezes juntos</div>
  </div>
  <div style="position:absolute;top:330px;left:72px;right:72px;border-top:4px solid var(--fundo);">
    ${VEZES.map(([ano, onde, mus]) => `<div style="display:grid;grid-template-columns:130px 330px 1fr;align-items:center;height:76px;border-bottom:3px solid var(--fundo);">
      <div style="${BS}font-size:54px;line-height:1;">${ano}</div><div style="font-weight:800;font-size:26px;">${onde}</div><div style="font-weight:900;font-size:28px;">${mus}</div></div>`).join("")}
  </div>
  ${rodape(2, true)}
</div>`);

// 03 PEARL JAM TOCA THE WHO (barras)
slides.push(`<div data-screen-label="slide-03" style="${S()}background:var(--fundo);color:var(--destaque);">
  <div style="position:absolute;top:72px;left:72px;right:72px;">
    <div style="display:flex;align-items:center;gap:14px;"><div style="background:var(--destaque);color:var(--fundo);font-weight:900;font-size:24px;letter-spacing:.14em;padding:8px 14px;">378 VEZES</div><div style="font-weight:800;font-size:24px;letter-spacing:.14em;color:var(--claro);">EDDIE + PEARL JAM</div></div>
    <div style="margin-top:22px;${BS}font-size:136px;line-height:.86;text-transform:uppercase;letter-spacing:-2px;">O Who que o Eddie mais canta</div>
  </div>
  <div style="position:absolute;top:500px;left:72px;right:72px;display:flex;flex-direction:column;gap:12px;">
    ${WHO.map(([nome, n]) => `<div style="display:flex;align-items:center;gap:16px;height:70px;">
      <div style="height:70px;width:${Math.max(n / 201 * 78, 34).toFixed(1)}%;background:var(--destaque);color:var(--fundo);display:flex;align-items:center;padding:0 22px;box-sizing:border-box;font-weight:800;font-size:28px;white-space:nowrap;">${nome}</div>
      <div style="${BS}font-size:56px;line-height:1;color:var(--claro);">${n}</div></div>`).join("")}
  </div>
  <div style="position:absolute;top:1170px;left:72px;font-weight:700;font-size:22px;color:var(--claro);opacity:.7;">Shows solo e do Pearl Jam somados. Fonte: setlist.fm.</div>
  ${rodape(3)}
</div>`);

// 04 BABA O'RILEY
slides.push(`<div data-screen-label="slide-04" style="${S()}background:var(--destaque);color:var(--fundo);">
  <div style="position:absolute;top:0;left:0;width:1080px;height:540px;overflow:hidden;"><img src="uploads/ev-commons-Werchter070718-86-cropped-.jpg" alt="Eddie Vedder no palco" style="width:100%;height:100%;object-fit:cover;object-position:60% 22%;filter:grayscale(1) contrast(1.35) brightness(1.05);mix-blend-mode:multiply;"></div>
  <div style="position:absolute;top:470px;left:56px;background:var(--fundo);color:var(--destaque);${BS}font-size:128px;line-height:.9;padding:14px 30px 6px;text-transform:uppercase;letter-spacing:-2px;">Baba O'Riley</div>
  <div style="position:absolute;top:650px;left:72px;font-weight:900;font-size:46px;letter-spacing:-.5px;">É do Who, mas virou do Pearl Jam.</div>
  <div style="position:absolute;top:740px;left:72px;right:72px;display:grid;grid-template-columns:1fr 1fr;gap:40px;">
    <div style="border-top:8px solid var(--fundo);padding-top:10px;"><div style="${BS}font-size:250px;line-height:.85;letter-spacing:-4px;">197</div><div style="font-weight:800;font-size:32px;margin-top:6px;">vezes com o Pearl Jam</div></div>
    <div style="border-top:8px solid var(--fundo);padding-top:10px;"><div style="${BS}font-size:250px;line-height:.85;letter-spacing:-4px;">2º</div><div style="font-weight:800;font-size:32px;margin-top:6px;">artista que a banda mais toca: o Who</div></div>
  </div>
  <div style="position:absolute;top:1090px;left:72px;right:72px;font-weight:800;font-size:32px;line-height:1.2;">Em 2024 ele cantou ela com o próprio Roger, no Royal Albert Hall.</div>
  ${rodape(4, true)}
</div>`);

// 05 QUADROPHENIA
slides.push(`<div data-screen-label="slide-05" style="${S()}background:var(--fundo);color:var(--claro);">
  <div style="position:absolute;top:72px;left:72px;right:72px;${BS}font-size:118px;line-height:.86;text-transform:uppercase;letter-spacing:-1.5px;color:var(--destaque);">A ponte entre os dois tem nome: Quadrophenia.</div>
  <div style="position:absolute;top:470px;left:72px;right:72px;display:flex;flex-direction:column;">
    <div style="display:grid;grid-template-columns:200px 1fr;gap:28px;align-items:center;padding:24px 0;border-top:3px solid var(--destaque);">
      <div style="${BS}font-size:120px;line-height:.85;color:var(--destaque);">3x</div>
      <div style="font-weight:700;font-size:32px;line-height:1.25;"><b style="font-weight:900;">The Real Me</b> em dueto com o Roger: 2009, 2015 e 2016.</div></div>
    <div style="display:grid;grid-template-columns:200px 1fr;gap:28px;align-items:center;padding:24px 0;border-top:3px solid var(--destaque);">
      <div style="${BS}font-size:120px;line-height:.85;color:var(--destaque);">2x</div>
      <div style="font-weight:700;font-size:32px;line-height:1.25;"><b style="font-weight:900;">The Punk and the Godfather</b>: Wembley 2019 e Royal Albert Hall 2024.</div></div>
    <div style="display:grid;grid-template-columns:200px 1fr;gap:28px;align-items:center;padding:24px 0;border-top:3px solid var(--destaque);border-bottom:3px solid var(--destaque);">
      <div style="${BS}font-size:120px;line-height:.85;color:var(--destaque);">25</div>
      <div style="font-weight:700;font-size:32px;line-height:1.25;">vezes que o Pearl Jam tocou <b style="font-weight:900;">Love Reign O'er Me</b>, o fecho do disco.</div></div>
  </div>
  ${rodape(5)}
</div>`);

// 07 SIMON TOWNSHEND
slides.push(`<div data-screen-label="slide-07" style="${S()}background:var(--fundo);color:var(--claro);">
  <img src="uploads/ev-commons-OhanaSep18-151-45223114071-.jpg" alt="Eddie Vedder com violão" style="position:absolute;top:0;left:0;width:1080px;height:1350px;object-fit:cover;object-position:52% 50%;">
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,color-mix(in srgb, var(--fundo) 92%, transparent) 0%,color-mix(in srgb, var(--fundo) 25%, transparent) 32%,color-mix(in srgb, var(--fundo) 20%, transparent) 50%,color-mix(in srgb, var(--fundo) 96%, transparent) 76%);"></div>
  <div style="position:absolute;top:72px;left:72px;right:72px;">
    <div style="font-weight:900;font-size:52px;letter-spacing:-.5px;">O elo no Ibirapuera:</div>
    <div style="${BS}font-size:200px;line-height:.82;color:var(--destaque);text-transform:uppercase;letter-spacing:-3px;margin-top:8px;">Simon Townshend</div>
  </div>
  <div style="position:absolute;top:840px;left:72px;right:72px;display:flex;flex-direction:column;gap:18px;">
    <div style="font-weight:800;font-size:36px;line-height:1.2;">Irmão do Pete, guitarrista da banda do Roger. Toca sexta e domingo, nas noites do Eddie, por indicação do próprio Eddie.</div>
    <div style="display:inline-block;align-self:flex-start;background:var(--alerta);color:var(--claro);padding:10px 18px;font-weight:900;font-size:32px;">Em 2024, os três fecharam a noite juntos em Londres.</div>
  </div>
  ${rodape(6)}
</div>`);

// 08 O CONTRA
slides.push(`<div data-screen-label="slide-08" style="${S()}${pontilhado}color:var(--fundo);">
  <div style="position:absolute;top:0;right:0;width:340px;height:1350px;overflow:hidden;"><img src="uploads/rd-38.jpg" alt="Roger Daltrey" style="width:100%;height:100%;object-fit:cover;object-position:62% 30%;filter:grayscale(1) contrast(1.3);mix-blend-mode:multiply;opacity:.9;"></div>
  <div style="position:absolute;top:72px;left:72px;width:640px;${BS}font-size:160px;line-height:.82;text-transform:uppercase;letter-spacing:-2px;">O que pesa contra.</div>
  <div style="position:absolute;top:470px;left:72px;width:620px;display:flex;flex-direction:column;">
    <div style="padding:18px 0;border-top:4px solid var(--fundo);"><div style="${BS}font-size:96px;line-height:.9;">0</div><div style="margin-top:6px;font-weight:800;font-size:28px;line-height:1.2;">vezes ele subiu no show do Roger num festival em que tocava em outro dia. Seria inédito.</div></div>
    <div style="padding:18px 0;border-top:4px solid var(--fundo);"><div style="${BS}font-size:96px;line-height:.9;">SEX · DOM</div><div style="margin-top:6px;font-weight:800;font-size:28px;line-height:1.2;">O Eddie toca nas noites do lado. O Roger, no sábado.</div></div>
    <div style="padding:18px 0;border-top:4px solid var(--fundo);border-bottom:4px solid var(--fundo);"><div style="${BS}font-size:96px;line-height:.9;">2025</div><div style="margin-top:6px;font-weight:800;font-size:28px;line-height:1.2;">No adeus do Who em Los Angeles, ele foi só pra assistir.</div></div>
  </div>
  ${rodape(7, true)}
</div>`);

// 09 A CONTA
slides.push(`<div data-screen-label="slide-09" style="${S()}background:var(--fundo);color:var(--claro);">
  <div style="position:absolute;top:72px;left:72px;right:72px;${BS}font-size:110px;line-height:.86;text-transform:uppercase;letter-spacing:-1.5px;color:var(--destaque);">Quando os dois estavam perto, ele subiu?</div>
  <div style="position:absolute;top:430px;left:60px;right:72px;display:grid;grid-template-columns:auto minmax(0,1fr);gap:30px;align-items:center;">
    <div style="${BS}font-size:330px;line-height:.78;color:var(--destaque);letter-spacing:-6px;">79%</div>
    <div style="font-weight:900;font-size:48px;line-height:1.05;">11 de 14 encontros que deu pra contar.</div>
  </div>
  <div style="position:absolute;top:760px;left:72px;right:72px;display:flex;gap:10px;">
    ${Array.from({ length: 14 }, (_, i) => i < 11 ? `<div style="flex:1;height:54px;background:var(--destaque);"></div>` : `<div style="flex:1;height:54px;border:4px solid var(--destaque);box-sizing:border-box;"></div>`).join("")}
  </div>
  <div style="position:absolute;top:870px;left:72px;right:72px;font-weight:700;font-size:28px;line-height:1.3;color:var(--papel2);">Os 3 sem palco junto: 12-12-12 em Nova York (2012), Rosemont (2015) e o adeus do Who em LA (2025). Encontro sem palco quase não vira notícia, então a conta puxa pro sim.</div>
  <div style="position:absolute;top:1090px;left:0;width:1080px;background:var(--destaque);color:var(--fundo);padding:24px 72px;box-sizing:border-box;font-weight:900;font-size:40px;line-height:1.08;">Palpite de fã: a porta está aberta, mas seria a primeira vez assim.</div>
  ${rodape(8)}
</div>`);

// 09 CTA: MONTA O SEU SETLIST (gerador do Ibirapuera)
slides.push(`<div data-screen-label="slide-cta" style="${S()}${pontilhado}color:var(--fundo);">
  <div style="position:absolute;top:72px;left:72px;right:72px;">
    <div style="display:flex;align-items:center;gap:14px;"><div style="background:var(--fundo);color:var(--destaque);font-weight:900;font-size:24px;letter-spacing:.14em;padding:8px 14px;">ANTES DO SHOW</div><div style="font-weight:800;font-size:24px;letter-spacing:.14em;">SEXTA 20 OU DOMINGO 22</div></div>
    <div style="margin-top:22px;${BS}font-size:150px;line-height:.84;text-transform:uppercase;letter-spacing:-2px;">Monta o seu setlist</div>
  </div>
  <img src="uploads/folha.png" alt="Setlist escrito à mão gerado no site" style="position:absolute;top:420px;right:56px;width:470px;transform:rotate(4deg);box-shadow:0 24px 60px rgba(0,0,0,.45);">
  <div style="position:absolute;top:450px;left:72px;width:460px;display:flex;flex-direction:column;gap:30px;">
    ${[["1", "Abre o <b>link da bio</b>"], ["2", "Põe o seu nome e escolhe a noite"], ["3", "Sorteia ou monta entre <b>401 músicas</b>"], ["4", "Sai <b>escrito à mão</b>, com a sua sorte em números"]].map(([n, t]) => `<div style="display:grid;grid-template-columns:70px 1fr;gap:16px;align-items:start;">
      <div style="width:62px;height:62px;border-radius:50%;background:var(--fundo);color:var(--destaque);${BS}font-size:44px;display:flex;align-items:center;justify-content:center;">${n}</div>
      <div style="font-weight:700;font-size:36px;line-height:1.15;padding-top:6px;">${t}</div></div>`).join("")}
  </div>
  <div style="position:absolute;top:1060px;left:72px;right:72px;background:var(--fundo);color:var(--destaque);padding:22px 28px;font-weight:900;font-size:36px;line-height:1.15;">Posta no story e marca a @smufdpj. A gente compartilha o seu.</div>
  ${rodape(9, true)}
</div>`);

// 10 FINAL
slides.push(`<div data-screen-label="slide-10" style="${S()}background:var(--fundo);color:var(--claro);">
  <img src="uploads/ev-commons-Ohana2019-99.jpg" alt="Eddie Vedder sorrindo ao microfone" style="position:absolute;top:0;left:0;width:1080px;height:640px;object-fit:cover;object-position:45% 30%;">
  <div style="position:absolute;top:0;left:0;width:1080px;height:660px;background:linear-gradient(180deg,transparent 50%,var(--fundo) 98%);"></div>
  <div style="position:absolute;top:64px;right:56px;transform:rotate(4deg);background:var(--alerta);color:var(--claro);padding:12px 26px 8px;${BS}font-size:60px;line-height:1;letter-spacing:2px;box-shadow:0 0 0 5px var(--alerta),0 0 0 9px var(--claro),0 18px 40px rgba(0,0,0,.45);">SEX · SÁB · DOM</div>
  <div style="position:absolute;top:560px;left:72px;right:72px;${BS}font-size:150px;line-height:.84;color:var(--destaque);text-transform:uppercase;letter-spacing:-2px;">Rola ou não rola?</div>
  <div style="position:absolute;top:870px;left:0;width:1080px;background:var(--destaque);color:var(--fundo);padding:26px 72px;box-sizing:border-box;font-weight:900;font-size:42px;line-height:1.08;">Comenta SIM ou NÃO e marca quem vai no sábado.</div>
  <div style="position:absolute;top:1040px;left:72px;right:72px;font-weight:700;font-size:32px;line-height:1.25;">Se aparecer, a música mais provável é das que eles já cantaram juntos: The Real Me, Punk and the Godfather ou Baba O'Riley.</div>
  ${rodape(10)}
</div>`);

const html = `<!DOCTYPE html>
<!-- Gerado por reels-especiais/eddie-daltrey/gera.mjs (não editar à mão). Modelo: media/carrossel/ranking/modelo.html -->
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><script src="./support.js"></script></head>
<body><x-dc><helmet>
<meta name="design_doc_mode" content="canvas">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Archivo:wght@500;700;800;900&display=swap" rel="stylesheet">
<style>:root{--destaque:#FFCC1A;--fundo:#14110F;--alerta:#E0361C;--papel:#f3efe6;--papel2:#E9E1CF;--claro:#fff;}body{margin:0;background:#1c1c1c;}</style>
</helmet>
<section style="display:flex;flex-wrap:wrap;gap:64px;padding:80px;align-items:flex-start;font-family:'Archivo',sans-serif;">
${slides.join("\n")}
</section></x-dc></body></html>`;
fs.writeFileSync(path.join(dir, "design", "carrossel.html"), html);
console.log("design/carrossel.html:", slides.length, "slides");
