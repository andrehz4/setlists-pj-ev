// Layout V, cenas 3 (estado riscado a lápis no papel de embrulho, pinos como etiquetas de preço, 5.5 a 9), 4 (uma
// plaquinha de preço por show espetada no caixote: cidade, hora no lugar do preço, @casa embaixo, 9 a 12.5) e 5 (faixa
// do toldo com o letreiro pintado pedindo pra compartilhar, plaquinha "Siga" e o link na etiqueta do caixote, 12.5 a 15).
import { p, pop, enter, lerp } from "../../tempo.mjs";
import { ufs } from "../../../mapa.mjs";
import { mundo, caixaDe, enquadra, tela, caminho, afastar } from "../../mapa-comum.mjs";
import { nomeUf } from "../../../voz.mjs";
import { texto, largura, cabe, fundo, tabuas, caixote, novoId, f1, rnd } from "./pecas.mjs";
import { toldo, papel, plaquinha, etiquetaPreco, lampada } from "./feira.mjs";
import { inteiro, metade, monte } from "./abacate.mjs";
import { TOLDO, diaDe, dataDe } from "./cenas-capa.mjs";

const hora = (h) => (h ? String(h).replace(/^(\d{1,2}):?(\d{2})?$/, (_, a, b) => `${Number(a)}h${b && b !== "00" ? b : ""}`) : "");
const banca = (cor, y = 1500) => fundo(cor) + tabuas(0, y, 1080, 1920 - y + 20, Math.max(2, Math.round((1940 - y) / 130)), cor, 21);

export function cenaMapa(T, story, cor) {
  if (T < 5.5 || T >= 9) return "";
  const ufsShow = [...new Set(story.shows.map((s) => s.uf))];
  const estado = ufsShow.length > 1 ? ufsShow.join(" e ") : nomeUf(ufsShow[0]);
  const N = story.shows.length, R = { x: 130, y: 600, w: 820, h: 700 - (N - 1) * 40 };
  const cam = enquadra(caixaDe(ufsShow.flatMap((uf) => (ufs()[uf] || []).flat().map(mundo))), R, 2, 40);
  const forma = (uf) => caminho((ufs()[uf] || []).map((q) => q.map((v) => tela(cam, mundo(v)))));
  const hac = novoId("vh"), cl = novoId("vm"), k = p(T, 5.75, 1.1, enter);
  const vizinhos = Object.keys(ufs()).filter((uf) => !ufsShow.includes(uf)).map((uf) => `<path d="${forma(uf)}" fill="none" stroke="${cor.lapis}" stroke-width="1.4" stroke-dasharray="4 7" opacity="0.35"/>`).join("");
  // traço de lápis: duas passadas levemente deslocadas, a segunda mais fraca
  const meus = ufsShow.map((uf) => `<path d="${forma(uf)}" fill="url(#${hac})" opacity="${f1(0.9 * k)}"/>
    <path d="${forma(uf)}" fill="none" stroke="${cor.lapis}" stroke-width="3" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${f1(1 - k)}"/>
    <path d="${forma(uf)}" fill="none" stroke="${cor.lapis}" stroke-width="1.3" opacity="0.5" transform="translate(3 -2)" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${f1(1 - k)}"/>`).join("");
  // etiquetas afastadas umas das outras (cidades vizinhas); o barbante liga a etiqueta ao ponto real da cidade
  const pts = story.shows.map((s) => tela(cam, mundo(s.lonlat))), desl = afastar(pts.map(([a, b]) => [a, b + 70]), 50, { x: 110, y: R.y - 20, w: 860, h: R.h + 60 });
  const pinos = story.shows.map((s, i) => { const [a, b] = pts[i], [dx, dy] = desl[i], kp = p(T, 6.7 + i * 0.3, 0.4, pop);
    return kp > 0.001 ? `<circle cx="${f1(a)}" cy="${f1(b)}" r="6" fill="${cor.acento}" opacity="${f1(Math.min(1, kp))}"/><path d="M${f1(a)},${f1(b)} L${f1(a + dx)},${f1(b + dy)}" stroke="${cor.barbante}" stroke-width="2" opacity="${f1(Math.min(1, kp) * 0.9)}"/>
      <g transform="translate(${f1(a + dx)} ${f1(b + dy)}) scale(${f1(kp)}) translate(${f1(-a - dx)} ${f1(-b - dy)})">${etiquetaPreco(a + dx, b + dy, "", cor, 1, (rnd(i + 5) - 0.5) * 16,
      texto(0, 92, String(i + 1), 46, cor.acento, { fonte: "anton" }))}</g>` : ""; }).join("");
  const mapa = `<pattern id="${hac}" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><path d="M0,0 V10" stroke="${cor.lapis}" stroke-width="1.1" opacity="0.4"/></pattern>
    <clipPath id="${cl}"><rect x="80" y="${R.y - 40}" width="920" height="${R.h + 80}"/></clipPath><g clip-path="url(#${cl})">${vizinhos}${meus}</g>${pinos}`;
  const kl = p(T, 6.3, 0.5, enter), yl = R.y + R.h + 90, fl = Math.min(64, ...story.shows.map((s, i) => cabe(`${i + 1}. ${s.cidade}`, 760, 64)));
  const lista = story.shows.map((s, i) => texto(160, yl + i * fl * 1.3, `${i + 1}. ${s.cidade}`, fl, cor.lapis, { anchor: "start" })).join("");
  const kpap = p(T, 5.5, 0.45, enter);
  return banca(cor) + `<g transform="translate(0 ${f1((1 - kpap) * 1500)})">${papel(540, 1010, 980, 1330, cor, 31, -1.2)}
    <g transform="rotate(-1.2 540 1010)">${texto(540, 440, "O show é em", 50, cor.lapis, { op: 0.85 })}${texto(540, 540, estado, cabe(estado, 800, 100), cor.acento)}
    ${mapa}<g opacity="${f1(kl)}">${lista}</g></g></g>` + inteiro(985, 1780, 0.2, 75, 0.85) + toldo(TOLDO, cor);
}

export function cenaShows(T, story, cor) {
  if (T < 9 || T >= 12.5) return "";
  const N = story.shows.length, H = Math.min(N === 1 ? 760 : 520, 1290 / N), y0 = 500 + (1290 - N * H) / 2;
  const itens = story.shows.map((sh, i) => {
    const k = p(T, 9.3 + i * 0.3, 0.5, pop);
    if (k <= 0.001) return "";
    const y = y0 + i * H, ph = Math.min(N === 1 ? 320 : 250, H * 0.55), ch = Math.min(N === 1 ? 260 : 190, H * 0.3), pw = 900, rot = (rnd(i + 3) - 0.5) * 4;
    const yc = y + H - ch - 20, yp = yc - ph - 50;
    const hh = hora(sh.hora) || "ver perfil", fh = Math.min(ph * 0.5, cabe(hh, 260, ph * 0.5)), wh = largura(hh, fh);
    const fc = Math.min(ph * 0.34, cabe(sh.cidade, pw - wh - 110, ph * 0.34)), casa = sh.casa || "detalhes no perfil da banda";
    const miolo = texto(40, ph * 0.46, sh.cidade, fc, cor.placaTinta, { anchor: "start" }) +
      texto(40, ph * 0.82, casa, Math.min(ph * 0.17, cabe(casa, pw - wh - 110, ph * 0.17, "sans")), cor.placaTinta, { anchor: "start", fonte: "sans", op: 0.75 }) +
      texto(pw - 40, ph * 0.5 + fh * 0.3, hh, fh, cor.acento, { anchor: "end" }) +
      `<path d="M${f1(pw - 46 - wh)},${f1(ph * 0.5 + fh * 0.48)} q${f1(wh / 2)},10 ${f1(wh + 8)},-4" fill="none" stroke="${cor.acento}" stroke-width="4" stroke-linecap="round" opacity="0.85"/>`;
    return `<g transform="translate(0 ${f1((1 - k) * 260)})" opacity="${f1(Math.min(1, k * 1.6))}">
      ${caixote(540, yc, 960, ch, cor, 40 + i * 9, monte(540, yc + 30, 920, ch / 760, 9 + i * 4))}${plaquinha(540 - pw / 2, yp, pw, ph, cor, rot, miolo, { palito: 80 })}</g>`;
  }).join("");
  const kt = p(T, 9.05, 0.4, enter), sub = `${diaDe(story.dia)}, ${dataDe(story.dia)}`;
  const yb = Math.max(1660, y0 + N * H - 30);
  return fundo(cor) + tabuas(0, yb, 1080, 1940 - yb, Math.max(1, Math.round((1940 - yb) / 130)), cor, 23) + lampada(150, 240, cor) + `<g opacity="${f1(kt)}">${texto(570, 350, "Shows de hoje", cabe("Shows de hoje", 760, 92), cor.sobreBg, { rot: -2 })}
    ${texto(570, 425, sub, 42, cor.sobreBg, { fonte: "sans", op: 0.8 })}</g>` + itens + toldo(TOLDO, cor);
}

export function cenaFinal(T, cor) {
  if (T < 12.5) return "";
  const kt = p(T, 12.5, 0.5, enter), FY = 250, FH = 590, l = ["COMPARTILHA", "COM QUEM VAI", "COM VOCÊ"];
  const f = Math.min(...l.map((t) => cabe(t, 900, 150, "anton"))), y0 = FY + FH / 2 - ((l.length - 1) * f * 1.12) / 2 + f * 0.36;
  const letreiro = l.map((t, i) => { const k = p(T, 12.75 + i * 0.15, 0.4, pop);
    return k > 0.001 ? `<g transform="translate(540 ${f1(y0 + i * f * 1.12)}) scale(${f1(k)})">${texto(4, 5, t, f, "#000", { fonte: "anton", op: 0.25 })}${texto(0, 0, t, f, cor.faixaTinta, { fonte: "anton" })}</g>` : ""; }).join("");
  const faixa = `<g transform="translate(0 ${f1((kt - 1) * (FY + FH))})">${toldo(FY + FH, cor)}<rect x="0" y="${FY}" width="1080" height="${FH}" fill="${cor.faixa}"/>
    <rect x="0" y="${FY}" width="1080" height="${FH}" fill="#000" opacity="0.08"/><path d="M0,${FY + 10} H1080 M0,${FY + FH - 10} H1080" stroke="${cor.faixaTinta}" stroke-width="2" stroke-dasharray="10 8" opacity="0.5"/>${letreiro}</g>`;
  const kc = p(T, 13.1, 0.5, enter), dy = (1 - kc) * 900, yc = 1460, pw = 780, ph = 190;
  const siga = texto(pw / 2, ph * 0.64, "Siga @smufdpj", cabe("Siga @smufdpj", pw - 80, 100), cor.placaTinta);
  const site = "somaisumfadepearljam.com.br/agenda", fs = cabe(site, 760, 44, "sans");
  const etiqueta = `<rect x="130" y="${yc + 120}" width="820" height="${f1(fs + 40)}" fill="${cor.etiq}" transform="rotate(-1 540 ${yc + 140})"/>
    ${texto(540, yc + 134 + fs * 0.62, site, fs, cor.rotuloTinta, { fonte: "sans", rot: -1 })}`;
  const baixo = `<g transform="translate(0 ${f1(dy)})">${caixote(540, yc, 960, 300, cor, 77, monte(540, yc + 40, 920, 0.25, 13) + metade(700, yc - 70, 0.17, -14))}
    ${etiqueta}${plaquinha(540 - pw / 2, yc - ph - 150, pw, ph, cor, -2.5, siga, { palito: 110 })}</g>`;
  return banca(cor, 1720) + lampada(880, FY + FH + 60, cor, p(T, 13.0, 0.5)) + baixo + faixa;
}
