// Gera a legenda .ass (libass) que o render queima no vídeo 1080x1920.
// ESPELHO de colab/legendas.css: mudou um, muda o outro. Tamanhos em cqw lá = % de 1080 aqui.
//   palavra  Archivo Black caixa-alta, contorno preto, 3 palavras por vez, a falada em âmbar e maior
//   faixa    Archivo Black em tarja creme, sombra vermelha deslocada, leve inclinação
//   cinema   Instrument Serif itálico, branco com sombra suave, mais baixo
//   nenhuma  só a marca do site e o crédito
// Tempos da legenda vêm no relógio do vídeo ORIGINAL; aqui viram relógio do corte.

import { palavrasDe } from "../../colab/legendas.js";

const W = 1080, H = 1920;
const cqw = (p) => Math.round((p / 100) * W);
// ASS usa &HAABBGGRR (alfa 00 = opaco).
const cor = (hex, alfa = "00") => `&H${alfa}${hex.slice(5, 7)}${hex.slice(3, 5)}${hex.slice(1, 3)}`.toUpperCase();
const CREME = "#f5f1e8", PRETO = "#0a0908", AMBAR = "#e8a13a", VERMELHO = "#c1272d", BRANCO = "#ffffff";
const LADOS = cqw(6);

const ESTILOS = {
  // Nome, Fonte, Tam, Primária, Secundária, Contorno, Fundo, Negrito, Itálico, Borda, Contorno, Sombra, Alinh, MargemV, Ângulo
  palavra: ["Archivo Black", cqw(8.4), CREME, PRETO, PRETO, 0, 0, 1, cqw(1), 6, 2, Math.round(H * 0.17), 0],
  faixa: ["Archivo Black", cqw(5.4), PRETO, CREME, VERMELHO, 0, 0, 3, 8, 10, 2, Math.round(H * 0.17), 1.2],
  cinema: ["Instrument Serif", cqw(7.2), BRANCO, PRETO, PRETO, 0, -1, 1, 0, 3, 2, Math.round(H * 0.08), 0],
};

function linhaEstilo(nome, [fonte, tam, prim, cont, fundo, negrito, italico, borda, contorno, sombra, alinh, margemV, angulo], alfaFundo = "00") {
  return `Style: ${nome},${fonte},${tam},${cor(prim)},${cor(prim)},${cor(cont)},${cor(fundo, alfaFundo)},${negrito},${italico},0,0,100,100,0,${angulo},${borda},${contorno},${sombra},${alinh},${LADOS},${LADOS},${margemV},1`;
}

export function tempoAss(seg) {
  const cs = Math.max(0, Math.round(seg * 100));
  const h = Math.floor(cs / 360000), m = Math.floor((cs % 360000) / 6000), s = Math.floor((cs % 6000) / 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs % 100).padStart(2, "0")}`;
}

const limpar = (t) => String(t).replace(/[{}\\]/g, "").replace(/\s+/g, " ").trim();
const evento = (ini, fim, estilo, texto) => `Dialogue: 0,${tempoAss(ini)},${tempoAss(fim)},${estilo},,0,0,0,,${texto}`;

// Estilo palavra: 1 evento por palavra, mostrando o grupo de 3 com a palavra falada acesa.
function eventosPalavra(trecho, desloc, dur) {
  const ps = palavrasDe(trecho).map((p) => ({ ...p, s: p.s - desloc, e: p.e - desloc }));
  const saida = [];
  ps.forEach((p, i) => {
    const ini = Math.max(0, p.s);
    const fim = Math.min(dur, i + 1 < ps.length ? ps[i + 1].s : trecho.end - desloc);
    if (fim <= ini) return;
    const g = Math.floor(i / 3) * 3;
    const texto = ps.slice(g, g + 3).map((q, j) => {
      const w = limpar(q.w).toUpperCase();
      return g + j === i ? `{\\c${cor(AMBAR)}\\fscx112\\fscy112\\frz2}${w}{\\r}` : w;
    }).join(" ");
    saida.push(evento(ini, fim, "palavra", texto));
  });
  return saida;
}

export function gerarAss({ estilo, legendas = [], trimStart = 0, trimEnd, credito }) {
  const dur = trimEnd - trimStart;
  const eventos = [
    evento(0, dur, "marca", "SÓ MAIS UM FÃ DE PEARL JAM"),
    credito ? evento(0, Math.min(4, dur), "credito", `{\\fad(250,500)}por ${limpar(credito)}`) : null,
  ];
  if (ESTILOS[estilo]) {
    for (const t of legendas) {
      if (!limpar(t.text) || t.end - trimStart <= 0 || t.start - trimStart >= dur) continue;
      if (estilo === "palavra") eventos.push(...eventosPalavra(t, trimStart, dur));
      else eventos.push(evento(Math.max(0, t.start - trimStart), Math.min(dur, t.end - trimStart + 0.15), estilo, limpar(t.text)));
    }
  }
  return [
    "[Script Info]", "ScriptType: v4.00+", `PlayResX: ${W}`, `PlayResY: ${H}`, "WrapStyle: 0", "ScaledBorderAndShadow: yes", "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    linhaEstilo("palavra", ESTILOS.palavra),
    linhaEstilo("faixa", ESTILOS.faixa),
    linhaEstilo("cinema", ESTILOS.cinema, "60"),
    linhaEstilo("marca", ["Archivo Black", 30, CREME, PRETO, PRETO, 0, 0, 1, 2, 0, 7, 90, 0]).replace(cor(CREME), cor(CREME, "40")),
    linhaEstilo("credito", ["Archivo Black", 36, AMBAR, PRETO, PRETO, 0, 0, 1, 3, 0, 7, 136, 0]),
    "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ...eventos.filter(Boolean),
  ].join("\n") + "\n";
}
