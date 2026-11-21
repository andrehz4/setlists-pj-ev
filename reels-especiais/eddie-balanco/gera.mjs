// Gera design/carrossel.html: balanço da sexta (20/11) + palpite pro domingo (22/11), no estilo do ranking solo.
// Números de analise.json (analisa.mjs, setlist.fm). Capa = quadro do vídeo do Andre (21h21), fora do git.
// Uso: node reels-especiais/eddie-balanco/gera.mjs && node scripts/publish/carrossel/render.mjs \
//        reels-especiais/eddie-balanco/design/carrossel.html reels-especiais/eddie-balanco/saida amarelo
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const A = JSON.parse(fs.readFileSync(path.join(dir, "analise.json"), "utf8"));
const hoje = Object.fromEntries(A.hoje.map((h) => [h.musica, h]));
const TOTAL = 9;
const BS = "font-family:'Big Shoulders Display',sans-serif;font-weight:900;";
const S = "width:1080px;height:1350px;position:relative;overflow:hidden;flex:none;";
const PONT = "background-color:var(--destaque);background-image:radial-gradient(rgba(0,0,0,.08) 1.2px,transparent 1.6px);background-size:10px 10px;";
const pc = (n) => String(n).replace(".", ",");
const rodape = (n, claro = false) => `
  <div style="position:absolute;bottom:40px;left:72px;right:72px;display:flex;align-items:center;justify-content:space-between;color:${claro ? "var(--fundo)" : "var(--claro)"};">
    <div style="display:flex;align-items:center;gap:14px;"><div style="width:62px;height:62px;border-radius:50%;overflow:hidden;border:3px solid ${claro ? "var(--fundo)" : "var(--destaque)"};background:var(--papel);"><img src="uploads/selo-smufdpj.jpg" alt="selo" style="width:100%;height:100%;object-fit:cover;transform:scale(1.1);"></div><div style="font-weight:800;font-size:26px;">@smufdpj</div></div>
    <div style="display:flex;align-items:center;gap:22px;font-weight:700;font-size:22px;"><div>Fonte: setlist.fm</div><div style="${BS}font-size:30px;color:${claro ? "var(--fundo)" : "var(--destaque)"};">${String(n).padStart(2, "0")}/${TOTAL}</div></div>
  </div>`;
const tag = (txt, claro) => `<div style="display:inline-block;background:${claro ? "var(--fundo)" : "var(--destaque)"};color:${claro ? "var(--destaque)" : "var(--fundo)"};font-weight:900;font-size:24px;letter-spacing:.14em;padding:8px 14px;">${txt}</div>`;
const tit = (t, tam, cor = "var(--destaque)") => `<div style="margin-top:18px;${BS}font-size:${tam}px;line-height:.88;text-transform:uppercase;letter-spacing:-2px;color:${cor};">${t}</div>`;
// Linha: nome + detalhe à esquerda, número grande à direita
const linhas = (itens, cor, tamN = 84) => itens.map(([nome, obs, valor]) => `<div style="display:flex;align-items:center;justify-content:space-between;gap:24px;padding:18px 0;border-top:4px solid ${cor};">
  <div><div style="font-weight:900;font-size:40px;line-height:1.05;">${nome}</div>${obs ? `<div style="margin-top:6px;font-weight:700;font-size:25px;opacity:.8;">${obs}</div>` : ""}</div>
  <div style="${BS}font-size:${tamN}px;line-height:.9;white-space:nowrap;">${valor}</div></div>`).join("");
const fundo = `${S}background:var(--fundo);color:var(--claro);`, amarelo = `${S}${PONT}color:var(--fundo);`;
const rep = (m) => hoje[m].repete_2a_noite.replace("/", " de ");

const slides = [];
slides.push(`<div data-screen-label="slide-01" style="${fundo}">
  <img src="uploads/capa.jpg" alt="Eddie Vedder sorrindo com a guitarra" style="position:absolute;top:0;left:0;width:1080px;height:900px;object-fit:cover;object-position:50% 0%;">
  <div style="position:absolute;top:0;left:0;width:1080px;height:920px;background:linear-gradient(180deg,rgba(20,17,15,.5) 0%,rgba(20,17,15,0) 25%,rgba(20,17,15,0) 45%,var(--fundo) 97%);"></div>
  <div style="position:absolute;top:60px;left:64px;transform:rotate(-3deg);background:var(--alerta);color:var(--claro);padding:12px 26px 8px;${BS}font-size:58px;line-height:1;box-shadow:0 0 0 5px var(--alerta),0 0 0 9px var(--claro);">SEXTA JÁ FOI</div>
  <div style="position:absolute;top:720px;left:64px;right:40px;${BS}font-size:132px;line-height:.86;color:var(--destaque);letter-spacing:-3px;text-transform:uppercase;">O que vem no domingo?</div>
  <div style="position:absolute;top:990px;left:64px;right:64px;font-weight:900;font-size:36px;line-height:1.12;">A setlist de sexta no Ibirapuera, o que foi raro e o nosso palpite pra segunda noite.</div>
  <div style="position:absolute;top:1130px;left:0;width:1080px;height:80px;background:var(--destaque);color:var(--fundo);display:flex;align-items:center;padding:0 64px;font-weight:900;font-size:30px;">${A.hoje.length} músicas na sexta. ${A.shows_base} shows solo na conta.</div>
  <div style="position:absolute;bottom:42px;right:64px;${BS}font-size:44px;color:var(--destaque);letter-spacing:2px;">ARRASTA →</div>
</div>`);

const lista = A.hoje.map((h, i) => `<div style="display:flex;gap:14px;align-items:baseline;padding:5px 0;"><div style="${BS}font-size:34px;width:46px;color:var(--alerta);">${i + 1}</div><div style="font-weight:800;font-size:27px;line-height:1.1;">${h.musica === "Elderly Woman Behind the Counter in a Small Town" ? "Elderly Woman" : h.musica}${i === A.hoje.length - 1 ? " <span style='opacity:.6'>(bis)</span>" : ""}</div></div>`);
slides.push(`<div data-screen-label="slide-02" style="${amarelo}">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("SEXTA, 20/11", true)}${tit("A setlist", 150, "var(--fundo)")}</div>
  <div style="position:absolute;top:330px;left:72px;right:72px;display:grid;grid-template-columns:1fr 1fr;column-gap:30px;">
    <div>${lista.slice(0, 11).join("")}</div><div>${lista.slice(11).join("")}</div></div>
  <div style="position:absolute;top:1130px;left:72px;right:72px;font-weight:800;font-size:24px;line-height:1.25;">No setlist.fm a lista ainda está marcada como incompleta e fora de ordem. Pode faltar música.</div>
  ${rodape(2, true)}
</div>`);

slides.push(`<div data-screen-label="slide-03" style="${fundo}">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("O QUE FOI RARO")}${tit("Quem foi viu", 140)}</div>
  <div style="position:absolute;top:330px;left:72px;right:72px;">${linhas([
    ["I'm the Answer", "com Simon Townshend no palco", `${hoje["I'm the Answer"].vezes + 1}ª VEZ`],
    ["Imagine", "John Lennon, rara nos shows solo", `${hoje.Imagine.vezes} EM ${A.shows_base}`],
    ["Black", "do Pearl Jam, quase nunca no solo", `${hoje.Black.vezes} EM ${A.shows_base}`],
    ["Last Kiss", "nenhuma vez nos shows de 2026", `${hoje["Last Kiss"].vezes} EM ${A.shows_base}`],
    ["Song of Good Hope", "dedicada ao Glen Hansard", "♥"],
  ], "var(--destaque)", 76)}</div>
  ${rodape(3)}
</div>`);

slides.push(`<div data-screen-label="slide-04" style="${amarelo}">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("AS DE SEMPRE", true)}${tit("Essas não falham", 140, "var(--fundo)")}</div>
  <div style="position:absolute;top:440px;left:72px;right:72px;">${linhas(["Porch", "Hard Sun", "Far Behind", "Society"].map((m) => [m, `${hoje[m].vezes} dos ${A.shows_base} shows solo`, `${pc(hoje[m].pct_carreira)}%`]), "var(--fundo)", 110)}</div>
  <div style="position:absolute;top:1120px;left:72px;right:72px;font-weight:800;font-size:28px;">Fatia dos shows solo da carreira, antes de sexta, em que cada uma apareceu.</div>
  ${rodape(4, true)}
</div>`);

slides.push(`<div data-screen-label="slide-05" style="${fundo}">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("A REGRA DA 2ª NOITE")}${tit("Domingo vai ser outro show", 130)}</div>
  <div style="position:absolute;top:500px;left:72px;${BS}font-size:300px;line-height:.85;color:var(--destaque);">${A.repeticao_media_desde_2011}%</div>
  <div style="position:absolute;top:780px;left:72px;right:72px;font-weight:900;font-size:42px;line-height:1.18;">é o quanto a 2ª noite costuma repetir da 1ª quando o Eddie faz dois shows seguidos na mesma cidade.</div>
  <div style="position:absolute;top:1000px;left:72px;right:72px;background:var(--destaque);color:var(--fundo);padding:22px 28px;font-weight:900;font-size:32px;line-height:1.2;">Na conta: ${A.pares_desde_2011} pares de noites desde 2011. Mais da metade do domingo deve ser diferente.</div>
  ${rodape(5)}
</div>`);

slides.push(`<div data-screen-label="slide-06" style="${amarelo}">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("PALPITE: FICAM", true)}${tit("Devem voltar no domingo", 120, "var(--fundo)")}</div>
  <div style="position:absolute;top:440px;left:72px;right:72px;">${linhas(["Hard Sun", "Porch", "Far Behind", "Can't Keep", "Society"].map((m) => [m, "voltou na 2ª noite", rep(m).toUpperCase()]), "var(--fundo)", 80)}</div>
  ${rodape(6, true)}
</div>`);

slides.push(`<div data-screen-label="slide-07" style="${fundo}">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("PALPITE: SAEM")}${tit("Devem descansar", 140)}</div>
  <div style="position:absolute;top:440px;left:72px;right:72px;">${linhas(["Immortality", "Last Kiss", "Brain Damage", "Corduroy"].map((m) => [m, "voltou na 2ª noite só", rep(m).toUpperCase()]), "var(--destaque)", 84)}</div>
  <div style="position:absolute;top:1090px;left:72px;right:72px;font-weight:800;font-size:28px;line-height:1.25;opacity:.85;">Immortality nunca repetiu na noite seguinte em ${hoje.Immortality.repete_2a_noite.split("/")[1]} chances.</div>
  ${rodape(7)}
</div>`);

const fora = Object.fromEntries(A.candidatos_fora_hoje_carreira.map((c) => [c.musica, c.pct]));
slides.push(`<div data-screen-label="slide-08" style="${amarelo}">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("PALPITE: ENTRAM", true)}${tit("Faltou na sexta", 140, "var(--fundo)")}</div>
  <div style="position:absolute;top:340px;left:72px;right:72px;">${linhas(["Rise", "Guaranteed", "I Am Mine", "You've Got to Hide Your Love Away", "No Ceiling"].map((m) => [m === "You've Got to Hide Your Love Away" ? "Hide Your Love Away" : m, "dos shows solo da carreira", `${pc(fora[m])}%`]), "var(--fundo)", 92)}</div>
  <div style="position:absolute;top:1130px;left:72px;right:72px;font-weight:800;font-size:26px;">As mais tocadas da carreira que ficaram de fora na sexta.</div>
  ${rodape(8, true)}
</div>`);

slides.push(`<div data-screen-label="slide-09" style="${fundo}">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("E VOCÊ?")}${tit("Qual não pode faltar no domingo?", 150)}</div>
  <div style="position:absolute;top:800px;left:72px;right:72px;font-weight:900;font-size:46px;line-height:1.15;">Comenta o seu palpite. Domingo à noite a gente confere quem acertou.</div>
  <div style="position:absolute;top:1030px;left:72px;right:72px;background:var(--destaque);color:var(--fundo);padding:22px 28px;font-weight:900;font-size:34px;">Salva pra conferir no domingo.</div>
  ${rodape(9)}
</div>`);

const html = `<!DOCTYPE html>
<!-- Gerado por reels-especiais/eddie-balanco/gera.mjs (não editar à mão). Modelo: media/carrossel/ranking/modelo.html -->
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
