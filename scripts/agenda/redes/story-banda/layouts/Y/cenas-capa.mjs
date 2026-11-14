// Layout Y, cenas 1 (um bloco de gelo cai por cima do clipe, racha, a casca solta e mostra "HOJE TEM" e o nome
// gravados, com gotas caindo, 0 a 3) e 2 (o logo congelado num cubo de gelo boiando, com @conta, estrada e base, 3 a 5.5).
import { p, pop, enter, lerp } from "../../tempo.mjs";
import { linhasDoNome } from "../G/placas.mjs";
import { txt, gravado, cabe, paisagem, geada, novoId, f1, f3 } from "./pecas.mjs";
import { bloco, racha, gota, cubo, contorno } from "./gelo.mjs";

const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
export const dataCurta = (dia) => `${DIAS[new Date(`${dia}T12:00:00Z`).getUTCDay()]}, ${dia.slice(8)}/${dia.slice(5, 7)}`;

// Metade da casca (lado -1 = esquerda, 1 = direita) cortada numa linha quebrada vertical
function metade(cx, cy, w, h, lado, conteudo) {
  const zig = Array.from({ length: 9 }, (_, i) => `${f1(cx + (i % 2 ? 22 : -16) + (i === 4 ? 30 : 0))},${f1(cy - h / 2 - 40 + (i * (h + 80)) / 8)}`);
  const borda = lado < 0 ? -60 : 1140, cl = novoId("yx");
  return `<clipPath id="${cl}"><polygon points="${borda},${f1(cy - h)} ${zig.join(" ")} ${borda},${f1(cy + h)}"/></clipPath><g clip-path="url(#${cl})">${conteudo}</g>`;
}

export function abertura(T, story, cor) {
  if (T >= 3) return "";
  const linhas = linhasDoNome(story.banda, 10), f = Math.min(...linhas.map((l) => cabe(l, 660, 150)));
  const N = story.shows.length, w = 820, h = 300 + linhas.length * f * 1.04 + 70, cx = 540, cy = 300 + h / 2;
  const kq = p(T, 0.05, 0.55, pop), dy = lerp(-1300, 0, kq), rot = lerp(-5, 0, Math.min(1, kq));
  const kr = p(T, 0.6, 0.45, enter), ks = p(T, 1.05, 0.75, enter);
  const yNome = cy - h / 2 + 230, yFim = yNome + linhas.length * f * 1.04;
  const data = `${dataCurta(story.dia)}${N > 1 ? ` · ${N} shows` : ""}`;
  const kt = p(T, 1.15, 0.5, enter);
  const texto = `<g opacity="${f3(kt)}">${gravado(cx, cy - h / 2 + 140, "HOJE TEM", 74, cor, { ls: 12 })}
    ${linhas.map((l, i) => gravado(cx, yNome + (i + 0.86) * f * 1.04, l, f, cor, { ls: 1 })).join("")}
    ${gravado(cx, yFim + 74, data, cabe(data, 640, 46, "xb"), cor, { fonte: "xb" })}</g>`;
  const miolo = bloco(cx, cy, w, h, 11, cor, { op: 0.9, N: 18 }) + racha(cx - 300, cy + h * 0.3, -0.5, 160, 70, cor, ks) +
    racha(cx + 330, cy - h * 0.32, 2.4, 140, 80, cor, ks) + texto;
  // casca: bloco mais claro por cima, com as rachaduras que vão crescendo a partir do impacto
  const casca = bloco(cx, cy, w + 24, h + 24, 23, { ...cor, gelo2: cor.gelo1, gelo3: cor.gelo2 }, { op: 0.96, N: 18, sombra: false }) +
    [[-1.5, 300], [-0.9, 380], [-2.3, 330], [1.6, 420], [0.5, 360], [2.8, 280]].map(([a, l], i) => racha(cx + 10, cy - h * 0.1, a, l, 30 + i * 9, cor, kr)).join("");
  const sai = (lado) => `<g opacity="${f3(Math.max(0, 1 - ks * 1.8))}" transform="translate(${f1(lado * 420 * ks)} ${f1(900 * ks * ks)}) rotate(${f1(lado * 18 * ks)} ${cx} ${f1(cy)})">${metade(cx, cy, w, h, lado, casca)}</g>`;
  const base = contorno(cx, cy, w, h, 11, 18).filter(([, y]) => y > cy + h * 0.3).sort((a, b) => a[0] - b[0]);
  const gotas = ks > 0.2 ? base.slice(1, -1).map(([x, y], i) => gota(T, x, y - 4, i * 13 + 3, cor, 520)).join("") : "";
  const veu = `<rect width="1080" height="1920" fill="#000" opacity="${f3(0.3 * p(T, 0, 0.3, enter))}"/>`;
  return veu + `<g transform="translate(0 ${f1(dy)}) rotate(${f1(rot)} ${cx} ${f1(cy)})">${miolo}${ks < 1 ? sai(-1) + sai(1) : ""}${gotas}</g>` + geada(T, 2.5, cor);
}

export function cenaLogo(T, story, cor, logoUri) {
  if (T < 3 || T >= 5.5) return "";
  const conta = story.conta || story.banda, S = 540, x = 540 - (S * 1.3) / 2, kc = p(T, 3.15, 0.7, pop);
  const y = 720 + Math.sin(T * 2.1) * 7 + (1 - Math.min(1, kc)) * -900, hz = 720 + S * 0.86;
  const { atras, frente } = cubo(x, y, S, cor), cl = novoId("yl"), pad = 34;
  const miolo = logoUri
    ? `<clipPath id="${cl}"><rect x="${f1(x + pad)}" y="${f1(y + pad)}" width="${S - 2 * pad}" height="${S - 2 * pad}" rx="6"/></clipPath>
       <image href="${logoUri}" x="${f1(x + pad)}" y="${f1(y + pad)}" width="${S - 2 * pad}" height="${S - 2 * pad}" clip-path="url(#${cl})" preserveAspectRatio="xMidYMid slice" opacity="0.92"/>
       <rect x="${f1(x + pad)}" y="${f1(y + pad)}" width="${S - 2 * pad}" height="${S - 2 * pad}" fill="${cor.gelo2}" opacity="0.12"/>`
    : `<rect x="${f1(x + pad)}" y="${f1(y + pad)}" width="${S - 2 * pad}" height="${S - 2 * pad}" fill="${cor.gelo3}" opacity="0.85"/>
       ${txt(x + S / 2, y + S / 2 + 40, story.banda.toUpperCase(), cabe(story.banda.toUpperCase(), S - 120, 120), cor.gelo1)}`;
  const kt = p(T, 3.5, 0.45, enter), f = cabe(conta, 860, 108);
  const topo = `<g opacity="${f3(kt)}" transform="translate(0 ${f1((1 - kt) * -30)})">${txt(540, 360, "CONGELADO PRA HOJE", 34, cor.sobreCeu, { fonte: "xb", ls: 8, op: 0.8 })}
    ${txt(540, 360 + f * 1.05, conta, f, cor.sobreCeu)}</g>`;
  const linhas = [story.desde ? `na estrada desde ${story.desde}` : "", story.cidadeBase ? `base: ${story.cidadeBase}` : ""].filter(Boolean);
  const kb = p(T, 3.9, 0.45, enter);
  const baixo = `<g opacity="${f3(kb)}">${linhas.map((l, i) => txt(540, hz + 250 + i * 66, l, cabe(l, 820, 48, "sb"), cor.sobreAgua, { fonte: "sb" })).join("")}</g>`;
  // água por cima da parte submersa do cubo, com marola na linha d'água
  const sub = `<rect y="${f1(hz)}" width="1080" height="${f1(1920 - hz)}" fill="${cor.agua2}" opacity="0.55"/>
    ${[0, 1, 2].map((i) => `<ellipse cx="540" cy="${f1(hz + 6 + i * 16)}" rx="${f1(420 + i * 90 + Math.sin(T * 3 + i) * 12)}" ry="${f1(6 + i * 4)}" fill="none" stroke="${cor.reflexo}" stroke-width="${f1(1.6 - i * 0.4)}" opacity="${f3(0.5 - i * 0.12)}"/>`).join("")}`;
  const gotas = [0.2, 0.5, 0.78].map((a, i) => gota(T, x + S * a, y + S + 2, 90 + i * 7, cor, 140)).join("");
  return paisagem(T, cor, { horizonte: hz }) + atras + miolo + frente + gotas + sub + topo + baixo + geada(T, 3.0, cor, true);
}
