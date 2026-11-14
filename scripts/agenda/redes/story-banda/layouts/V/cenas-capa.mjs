// Layout V, cenas 1 (toldo desce e o abacate abre ao meio por cima do clipe: "HOJE TEM" no caroço, banda na polpa e a
// data numa plaquinha, 0 a 3) e 2 (o toldo sobe, o caixote entra e o logo é colado como rótulo; desde e base escritos
// no papel de embrulho, 3 a 5.5).
import { p, pop, enter, lerp } from "../../tempo.mjs";
import { linhasDoNome } from "../G/placas.mjs";
import { texto, largura, cabe, fundo, tabuas, caixote, novoId, f1 } from "./pecas.mjs";
import { toldo, papel, plaquinha, lampada } from "./feira.mjs";
import { inteiro, metade, monte, meiaLargura, CAROCO } from "./abacate.mjs";

const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
export const diaDe = (dia) => DIAS[new Date(`${dia}T12:00:00Z`).getUTCDay()];
export const dataDe = (dia) => `${dia.slice(8)}/${dia.slice(5, 7)}`;
export const TOLDO = 170; // onde o babado do toldo começa nas cenas da barraca

// nome da banda nas linhas da polpa: corpo único que cabe na largura do abacate em cada linha (medido no Anton)
function nomeNaPolpa(linhas) {
  const base = (i, f) => 20 - (linhas.length - 1 - i) * f * 1.2;
  const cabeTudo = (f) => linhas.every((l, i) => largura(l, f, "anton", 1) <= 2 * meiaLargura(base(i, f) - f * 0.8) * 0.84);
  let f = Math.min(170, 440 / linhas.length / 1.2);
  while (f > 30 && !cabeTudo(f)) f -= 2;
  return linhas.map((l, i) => ({ l, y: base(i, f), f }));
}

export function abertura(T, story, cor) {
  if (T >= 3) return "";
  const cx = 540, cy = 1250, s = 1, N = story.shows.length;
  const veu = `<rect width="1080" height="420" fill="#000" opacity="${f1(0.25 * p(T, 0, 0.4))}"/>`;
  const ke = p(T, 0.05, 0.6, pop), dy = lerp(1100, 0, ke);
  const kl = p(T, 0.85, 0.55, enter); // a outra metade sai pra cima e pra direita
  const faca = p(T, 0.6, 0.25, enter);
  const tampa = kl < 1 ? `<g transform="translate(${f1(cx + kl * 1000)} ${f1(cy + dy - kl * 380)}) rotate(${f1(kl * 50)})">${inteiro(0, 0, s, 0, 1, kl < 0.05)}
    ${faca > 0 && kl < 0.05 ? `<path d="M0,${f1(-430 * s)} V${f1((-430 + 860 * faca) * s)}" stroke="#f7f0c8" stroke-width="3" opacity="0.85"/>` : ""}</g>` : "";
  const nome = nomeNaPolpa(linhasDoNome(story.banda, 10)).map(({ l, y, f }, i) => {
    const k = p(T, 1.15 + i * 0.12, 0.35, pop);
    return k > 0.001 ? `<g transform="translate(0 ${f1(y)}) scale(${f1(k)})">${texto(0, 0, l, f, cor.polpaTinta, { fonte: "anton", ls: 1 })}</g>` : "";
  }).join("");
  // "HOJE TEM" escrito no caroço com pincel: revela da esquerda pra direita
  const fh = cabe("HOJE TEM", CAROCO.rx * 1.6, 72), kw = p(T, 1.35, 0.45, enter), cl = novoId("vw");
  const hoje = `<clipPath id="${cl}"><rect x="-200" y="${CAROCO.cy - 120}" width="${f1(400 * kw)}" height="240"/></clipPath>
    <g clip-path="url(#${cl})" transform="rotate(-6 0 ${CAROCO.cy})">${texto(0, CAROCO.cy + fh * 0.35, "HOJE TEM", fh, cor.carocoTinta)}</g>`;
  const corpo = `<g transform="translate(${cx} ${f1(cy + dy)})">${kl > 0 ? metade(0, 0, s, 0, p(T, 1.2, 0.6)) + `<g transform="scale(${s})">${nome}${hoje}</g>` : ""}</g>`;
  // data numa plaquinha espetada ao lado do abacate
  const kp = p(T, 1.7, 0.45, pop), linhas = [`${diaDe(story.dia)},`, dataDe(story.dia), N > 1 ? `${N} shows` : ""].filter(Boolean);
  const pw = 290, ph = 70 + linhas.length * 62, fp = Math.min(...linhas.map((l) => cabe(l, pw - 50, 60)));
  const miolo = linhas.map((l, i) => texto(pw / 2, 78 + i * 62, l, i === 2 ? fp * 0.8 : fp, i === 2 ? cor.acento : cor.placaTinta)).join("");
  const placa = kp > 0.001 ? `<g transform="translate(0 ${f1((1 - kp) * 900)})">${plaquinha(760, 1690 - ph - 110, pw, ph, cor, lerp(18, 7, kp), miolo, { palito: 110 })}</g>` : "";
  const sobe = p(T, 2.5, 0.5, enter);
  return veu + toldo(TOLDO, cor, p(T, 0, 0.45, enter)) + corpo + tampa + placa + (sobe > 0 ? toldo(lerp(TOLDO, 1990, sobe), cor) : "");
}

export function cenaLogo(T, story, cor, logoUri) {
  if (T < 3 || T >= 5.5) return "";
  const conta = story.conta || story.banda, kc = p(T, 3.05, 0.45, enter), cy = 660, ch = 600, dyc = (1 - kc) * 1300;
  const banca = fundo(cor) + lampada(880, 250, cor) + tabuas(0, 1260, 1080, 680, 5, cor, 11);
  const cx0 = caixote(540, cy + dyc, 940, ch, cor, 3, monte(540, cy + dyc + 40, 900, 0.27, 5));
  // rótulo de caixote: papel creme com filete duplo, logo e @conta; bate e gruda (pop) com leve giro
  const kr = p(T, 3.4, 0.45, pop), rw = 560, rh = 580, rx = 540 - rw / 2, ry = cy + 20, lado = 420, cl = novoId("vlo");
  const fc = cabe(conta, rw - 70, 64, "anton");
  const img = logoUri
    ? `<clipPath id="${cl}"><rect x="${rx + 70}" y="${ry + 40}" width="${lado}" height="${lado}" rx="8"/></clipPath><image href="${logoUri}" x="${rx + 70}" y="${ry + 40}" width="${lado}" height="${lado}" clip-path="url(#${cl})" preserveAspectRatio="xMidYMid slice"/>`
    : (() => { const ls = linhasDoNome(story.banda, 9), f = Math.min(...ls.map((l) => cabe(l, lado - 50, 110, "anton")));
      return `<rect x="${rx + 70}" y="${ry + 40}" width="${lado}" height="${lado}" rx="8" fill="${cor.polpaTinta}"/>` +
        ls.map((l, i) => texto(540, ry + 40 + lado / 2 + (i - (ls.length - 1) / 2) * f * 1.15 + f * 0.36, l, f, cor.rotulo, { fonte: "anton" })).join(""); })();
  const rotulo = kr > 0.001 ? `<g transform="translate(540 ${ry + rh / 2}) rotate(${f1(lerp(-12, -2.5, kr))}) scale(${f1(lerp(1.4, 1, Math.min(1, kr)))}) translate(-540 ${-(ry + rh / 2)})" opacity="${f1(Math.min(1, kr * 2))}">
    <rect x="${rx + 8}" y="${ry + 12}" width="${rw}" height="${rh}" fill="#000" opacity="0.3"/><rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="${cor.rotulo}"/>
    <rect x="${rx + 16}" y="${ry + 16}" width="${rw - 32}" height="${rh - 32}" fill="none" stroke="${cor.acento}" stroke-width="5"/><rect x="${rx + 28}" y="${ry + 28}" width="${rw - 56}" height="${rh - 56}" fill="none" stroke="${cor.acento}" stroke-width="1.5"/>
    ${img}${texto(540, ry + rh - 50, conta, fc, cor.rotuloTinta, { fonte: "anton", ls: 1 })}</g>` : "";
  // desde e base escritos no papel de embrulho em cima da banca
  const kp = p(T, 3.75, 0.45, enter), linhas = [story.desde ? `na estrada desde ${story.desde}` : "", story.cidadeBase ? `base: ${story.cidadeBase}` : ""].filter(Boolean);
  const fl = Math.min(...linhas.map((l) => cabe(l, 800, 66)), 66), kt = p(T, 4.0, 0.6, enter), clt = novoId("vlt");
  const escrita = `<clipPath id="${clt}"><rect x="90" y="1300" width="${f1(900 * kt)}" height="400"/></clipPath>
    <g clip-path="url(#${clt})" transform="rotate(-2 540 1490)">${linhas.map((l, i) => texto(540, 1490 + (i - (linhas.length - 1) / 2) * fl * 1.45 + fl * 0.35, l, fl, cor.lapis)).join("")}</g>`;
  const emb = kp > 0 && linhas.length ? `<g transform="translate(0 ${f1((1 - kp) * 600)})">${papel(540, 1490, 920, 300, cor, 7, -2)}${escrita}</g>` : "";
  return banca + cx0 + rotulo + emb + toldo(lerp(1990, TOLDO, p(T, 3.0, 0.45, enter)), cor);
}
