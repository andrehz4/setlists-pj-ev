// Layout K, cenas 4 (os shows de hoje como músicas numeradas do setlist, 9 a 12.5) e 5 (o bis: pedido de
// compartilhar escrito na folha, 12.5 a 15). "ENSAIO" é riscado e vira "SHOW HOJE!"; show sem horário ganha
// "hora?" riscado e "ver no perfil".
import { p, enter } from "../../tempo.mjs";
import { palco, folha, escreve, risco, circulo, larg, cabe, F_INTER_XB } from "./pecas.mjs";

const hora = (h) => (h ? String(h).replace(/^(\d{1,2}):?(\d{2})?$/, (_, a, b) => `${Number(a)}h${b && b !== "00" ? b : ""}`) : null);

function linhaShow(T, sh, i, { y, alto, at, cor }) {
  const e = Math.min(1.4, alto / 230), fc = cabe(sh.cidade, 680, 104 * e), f2 = 52 * e;
  let s = escreve(T, at, { x: 60, y: y + 80 * e, t: `${i + 1}.`, f: 80 * e, cor: cor.acento, rot: -2 }) +
    escreve(T, at + 0.1, { x: 170 * Math.min(1, e), y: y + 80 * e, t: sh.cidade.toUpperCase(), f: fc, cor: cor.tinta, rot: -1.5 });
  const x2 = 170 * Math.min(1, e), y2 = y + 150 * e, casa = sh.casa ? `${sh.casa}  ·  ` : "", h = hora(sh.hora);
  if (h) return s + escreve(T, at + 0.4, { x: x2, y: y2, t: `${casa}${h}`, f: Math.min(f2, cabe(`${casa}${h}`, 680, f2)), cor: cor.tinta, op: 0.75, rot: -1 });
  const resto = "ver no perfil", f = Math.min(f2, cabe(`${casa}hora?  ${resto}`, 680, f2));
  const xh = x2 + larg(casa, f), wh = larg("hora?", f);
  return s + escreve(T, at + 0.4, { x: x2, y: y2, t: `${casa}hora?`, f, cor: cor.tinta, op: 0.75, rot: -1 }) +
    risco(T, at + 0.8, { x1: xh - 6, x2: xh + wh + 6, y: y2 - f * 0.3, cor: cor.tinta, w: 6 }) +
    escreve(T, at + 1.0, { x: xh + wh + 26, y: y2, t: resto, f, cor: cor.acento, rot: -1 });
}

export function cenaShows(T, story, cor) {
  if (T < 9 || T >= 12.5) return "";
  const N = story.shows.length, alto = Math.min(330, 900 / N);
  const wE = larg("ENSAIO", 80);
  let s = escreve(T, 9.1, { x: 60, y: 150, t: "ENSAIO", f: 80, cor: cor.tinta, rot: -1.5 }) +
    risco(T, 9.45, { x1: 50, x2: 70 + wE, y: 128, cor: cor.acento, w: 11 }) +
    escreve(T, 9.65, { x: 110 + wE, y: 150, t: "SHOW HOJE!", f: cabe("SHOW HOJE!", 760 - 50 - wE, 80), cor: cor.acento, rot: -3 }) +
    `<rect x="60" y="190" width="${(760 * p(T, 9.9, 0.4, enter)).toFixed(1)}" height="7" rx="3" fill="${cor.tinta}" opacity="0.8"/>`;
  story.shows.forEach((sh, i) => { s += linhaShow(T, sh, i, { y: 240 + i * alto, alto, at: 10.0 + i * 0.35, cor }); });
  const h = Math.max(820, 300 + N * alto);
  return palco(T, cor) + folha({ x: 70, y: Math.round(330 + (1230 - h) / 2), w: 940, h, rot: 0.8, cor, k: p(T, 9.0, 0.3, enter) }, s);
}

export function cenaFinal(T, cor) {
  if (T < 12.5) return "";
  const site = "somaisumfadepearljam.com.br/agenda", fs = cabe(site, 780, 46);
  const linhas = ["Compartilha", "com quem vai", "com você"], f = cabe("com quem vai", 780, 150);
  const titulo = linhas.map((l, i) => escreve(T, 12.75 + i * 0.3, { x: 60, y: 430 + i * f * 1.15, t: l, f, cor: i === 0 ? cor.acento : cor.tinta, rot: -2 })).join("");
  const ySiga = 430 + 3 * f * 1.15 + 60, siga = "siga @smufdpj", fsg = cabe(siga, 700, 76);
  const conteudo = `<text x="60" y="96" font-family="${F_INTER_XB}" font-weight="800" font-size="34" letter-spacing="10" fill="${cor.tinta}" opacity="0.55">SETLIST</text>` +
    escreve(T, 12.55, { x: 90, y: 250, t: "BIS", f: 96, cor: cor.acento, rot: -4 }) +
    circulo(T, 12.8, { cx: 90 + larg("BIS", 96) / 2, cy: 218, rx: larg("BIS", 96) / 2 + 50, ry: 70, cor: cor.acento, w: 7 }) + titulo +
    escreve(T, 13.75, { x: 60, y: ySiga, t: siga, f: fsg, cor: cor.tinta, rot: -1 }) +
    risco(T, 14.1, { x1: 60, x2: 80 + larg(siga, fsg), y: ySiga + 26, cor: cor.acento, w: 8 }) +
    escreve(T, 14.2, { x: 60, y: ySiga + 150, t: site, f: fs, cor: cor.tinta, rot: -1, dur: 0.6 });
  return palco(T, cor) + folha({ x: 90, y: 330, w: 900, h: 1230, rot: -1.5, cor, k: p(T, 12.5, 0.3, enter) }, conteudo);
}

