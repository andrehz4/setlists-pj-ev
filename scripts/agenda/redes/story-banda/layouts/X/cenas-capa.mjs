// Layout X, cenas 1 (um raio corta a tela por cima do clipe e acende o letreiro de neon "HOJE TEM" + nome da banda
// + data, 0 a 3) e 2 (logo num espelho de camarim art déco: moldura em degraus, leques e lâmpadas acendendo em
// sequência, com @conta, estrada e base, 3 a 5.5).
import { p, pop, enter, lerp, clamp } from "../../tempo.mjs";
import { linhasDoNome } from "../G/placas.mjs";
import { fundo, varre, neon, ligado, leque, molduraDeco, rotulo, txt, cabe, largura, novoId, f1, op3 } from "./pecas.mjs";
import { raio, clarao, lampada } from "./eletrica.mjs";

const DIAS = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
export const dataDoDia = (dia) => `${DIAS[new Date(`${dia}T12:00:00Z`).getUTCDay()]}, ${dia.slice(8)}/${dia.slice(5, 7)}`;

export function abertura(T, story, cor) {
  if (T >= 3) return "";
  const linhas = linhasDoNome(story.banda, 11), f = Math.min(...linhas.map((l) => cabe(l, 740, 170)));
  const N = story.shows.length, x = 100, w = 880, y0 = 540, data = dataDoDia(story.dia);
  const yNome = y0 + 205, yFim = yNome + linhas.length * f * 1.1, h = yFim - y0 + (N > 1 ? 210 : 160);
  // a placa cai pendurada nos cabos e balança um pouco até parar
  const kq = p(T, 0.25, 0.55, pop), dy = lerp(-h - y0, 0, clamp(kq, 0, 1.2)), giro = 2.2 * Math.sin(T * 7) * Math.exp(-(T - 0.6) * 2.2) * (T > 0.6 ? 1 : 0);
  const kt = ligado(T, 0.55), kn = (i) => ligado(T, 0.8 + i * 0.12), kd = p(T, 1.3, 0.4, enter);
  const placa = `<g transform="translate(0 ${f1(dy)}) rotate(${f1(giro)} 540 0)">
    <path d="M${x + 120},-300 L${x + 120},${y0} M${x + w - 120},-300 L${x + w - 120},${y0}" stroke="${cor.fio}" stroke-width="3"/>
    <rect x="${x + 12}" y="${y0 + 16}" width="${w}" height="${f1(h)}" fill="#000" opacity="0.45"/>
    <rect x="${x}" y="${y0}" width="${w}" height="${f1(h)}" fill="${cor.bg}" opacity="0.86"/>${molduraDeco(x, y0, w, h, cor.ouro, { s: 30 })}
    ${leque(540, y0, 120, 180, 360, 14, cor.ouro, { op: 0.9, w: 1.4 })}
    ${neon(540, y0 + 130, "HOJE TEM", 74, cor, kt, { ls: 6 })}
    <path d="M${x + 150},${y0 + 168} H${x + w - 150}" stroke="${cor.ouro}" stroke-width="1.4" opacity="0.8"/>
    ${linhas.map((l, i) => neon(540, yNome + i * f * 1.1 + f * 0.92, l, f, cor, kn(i), { ls: 1 })).join("")}
    <g opacity="${op3(kd)}">${txt(540, yFim + 82, data, 46, cor.ouro, { fonte: "xb", ls: 4 })}
    ${N > 1 ? txt(540, yFim + 140, `${N} SHOWS HOJE`, 34, cor.texto, { fonte: "sb", ls: 6, op: 0.85 }) : ""}</g></g>`;
  const veu = `<rect width="1080" height="1920" fill="#000" opacity="${op3(0.38 * p(T, 0, 0.3))}"/>`;
  return veu + clarao(T, 0.15, cor) + raio(T, 0.12, [820, -30], [250, 1950], cor, { semente: story.banda.length, desvio: 170 }) + placa + varre(T, 2.55, cor);
}

// lâmpadas do espelho de camarim: laterais inteiras e topo/base só fora dos leques
function lampadas(T, X0, Y0, X1, Y1, cor) {
  const pts = [], n = 7;
  for (let i = 0; i < n; i++) { const y = lerp(Y0, Y1, i / (n - 1)); pts.push([X0, y], [X1, y]); }
  for (const x of [X0 + 85, X1 - 85]) pts.push([x, Y0], [x, Y1]);
  pts.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  return pts.map(([x, y], i) => lampada(x, y, 13, cor, ligado(T, 3.3 + i * 0.045))).join("");
}

export function cenaLogo(T, story, cor, logoUri) {
  if (T < 3 || T >= 5.5) return "";
  const conta = story.conta || story.banda, lado = 520, fx = 540 - lado / 2, fy = 670, m = 56;
  const kf = p(T, 3.1, 0.5, pop), cl = novoId("xc"), s = lerp(0.85, 1, kf);
  const linhas = linhasDoNome(story.banda, 10), fr = Math.min(...linhas.map((l) => cabe(l, lado - 80, 110)));
  const img = logoUri
    ? `<clipPath id="${cl}"><rect x="${fx}" y="${fy}" width="${lado}" height="${lado}"/></clipPath><image href="${logoUri}" x="${fx}" y="${fy}" width="${lado}" height="${lado}" clip-path="url(#${cl})" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect x="${fx}" y="${fy}" width="${lado}" height="${lado}" fill="${cor.metal}"/>` + linhas.map((l, i) =>
      neon(540, fy + lado / 2 + (i - (linhas.length - 1) / 2) * fr * 1.1 + fr * 0.4, l, fr, cor, ligado(T, 3.4))).join("");
  const espelho = `<g opacity="${op3(Math.min(1, kf * 2))}" transform="translate(540 ${fy + lado / 2}) scale(${s.toFixed(4)}) translate(-540 ${-(fy + lado / 2)})">
    ${leque(540, fy - m, 150, 180, 360, 18, cor.ouro, { op: 0.85, w: 1.3 })}${leque(540, fy + lado + m, 110, 0, 180, 12, cor.ouro, { op: 0.85, w: 1.3 })}
    <rect x="${fx - m + 10}" y="${fy - m + 14}" width="${lado + 2 * m}" height="${lado + 2 * m}" fill="#000" opacity="0.4"/>
    <rect x="${fx - m}" y="${fy - m}" width="${lado + 2 * m}" height="${lado + 2 * m}" fill="${cor.bg}"/>${molduraDeco(fx - m, fy - m, lado + 2 * m, lado + 2 * m, cor.ouro, { s: 28 })}
    ${img}<rect x="${fx}" y="${fy}" width="${lado}" height="${lado}" fill="none" stroke="${cor.ouro}" stroke-width="1.5"/>
    ${lampadas(T, fx - m - 34, fy - m - 34, fx + lado + m + 34, fy + lado + m + 34, cor)}</g>`;
  const kt = p(T, 3.6, 0.45, enter), yt = fy + lado + m + 34 + 140;
  const fc = cabe(conta, 860, 70, "anton");
  const extras = [story.desde ? `na estrada desde ${story.desde}` : "", story.cidadeBase ? `base: ${story.cidadeBase}` : ""].filter(Boolean);
  const texto = `<g opacity="${op3(kt)}" transform="translate(0 ${f1((1 - kt) * 24)})">${neon(540, yt, conta, fc, cor, ligado(T, 3.7))}
    ${extras.map((l, i) => txt(540, yt + 78 + i * 60, l, cabe(l, 820, 42, "sb"), cor.texto, { fonte: "sb", ls: 1, op: 0.9 })).join("")}</g>`;
  return fundo(cor) + rotulo(300, "NO CAMARIM", cor) + espelho + texto;
}
