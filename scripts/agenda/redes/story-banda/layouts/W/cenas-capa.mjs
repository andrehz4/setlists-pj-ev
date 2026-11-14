// Layout W, cenas 1 (três quadros de tirinha se abrem em sequência por cima do clipe, que fica visível no meio:
// sol e onda, balão "HOJE TEM!" e o nome da banda com a data batida a máquina, 0 a 3) e 2 (o logo num quadro grande
// com explosão de raios e a onomatopeia "TCHAN!", recordatórios com @conta, estrada e base, 3 a 5.5).
import { p, pop, enter, lerp } from "../../tempo.mjs";
import { linhasDoNome } from "../G/placas.mjs";
import { painel, balao, legenda, estrela, fundo, txt, datilo, batido, novoId, f1, op3 } from "./pecas.mjs";
import { cabe } from "./medida.mjs";
import { sol, onda, prancha } from "./desenhos.mjs";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const dataDe = (dia) => `${DIAS[new Date(`${dia}T12:00:00Z`).getUTCDay()]}, ${dia.slice(8)}/${dia.slice(5, 7)}`;

const LINHA_V = 10;
// troca de cena: o fundo de sarjeta sobe e cobre o clipe
const varre = (T, at, cor) => { const y = lerp(1920, 0, p(T, at, 0.42, enter));
  return y < 1920 ? `<g transform="translate(0 ${f1(y)})">${fundo(cor)}<rect width="1080" height="${LINHA_V}" fill="${cor.linha}"/></g>` : ""; };

export function abertura(T, story, cor) {
  if (T >= 3) return "";
  const kA = p(T, 0.05, 0.4, pop), kB = p(T, 0.3, 0.4, pop), kC = p(T, 0.6, 0.45, pop);
  const A = painel(60, 230, 380, 330, cor, { fill: cor.piscina, pontos: [cor.ponto, 18, 3.4, 0.35], k: kA, origem: "tl", rot: -1.5 },
    sol(330, 330, 0.72, cor, T * 40) + onda(190, 470, 0.95, cor));
  const kb = p(T, 0.55, 0.35, pop), hoje = "HOJE TEM!", fh = cabe(hoje, 380, 86);
  const B = painel(470, 230, 550, 330, cor, { fill: cor.amarelo, pontos: [cor.laranja, 16, 3.6, 0.55], k: kB, origem: "tr", rot: 1.2 },
    balao(735, 370, 470, 210, cor, { tx: 600, ty: 545, k: kb }) + (kb > 0.6 ? txt(735, 370 + fh * 0.36, hoje, fh, cor.linha) : ""));
  // nome: corpo pela maior linha (medida real) e limite de altura pelo número de linhas
  const linhas = linhasDoNome(story.banda, 11), n = linhas.length;
  const f = Math.min(...linhas.map((l) => cabe(l, 820, 150, "archivo", 2)), 300 / (n * 1.08));
  const h = 150 + n * f * 1.08 + 40, y = Math.min(1180, 1660 - h);
  const nome = linhas.map((l, i) => txt(540, y + 140 + (i + 0.8) * f * 1.08, l, f, "#fff", { ls: 2, contorno: [cor.linha, 12] })).join("");
  const dt = dataDe(story.dia), kd = p(T, 1.05, 0.6, (x) => x), fd = 40;
  const data = legenda(90, y + 28, 470, 78, cor, cor.balao, datilo(116, y + 82, batido(dt, kd), fd, cor.linha, { T, cursor: T < 2.4 }), -1);
  const C = painel(60, y, 960, h, cor, { fill: cor.vermelho, pontos: [cor.linha, 20, 4, 0.18], k: kC, origem: "bl", rot: -0.8 },
    prancha(930, y + h - 60, 0.6, cor, -20) + nome);
  const N = story.shows.length, extra = N > 1 && kC >= 1 ? estrela(900, y + 20, 112, 86, 14, cor.amarelo, cor, { semente: 3, k: p(T, 1.4, 0.35, pop), rot: 8 }) + (T < 1.6 ? "" :
    txt(900, y + 30, `${N} SHOWS`, cabe(`${N} SHOWS`, 140, 30), cor.linha, { rot: 8 })) : "";
  const veu = `<rect width="1080" height="1920" fill="#000" opacity="${op3(0.18 * p(T, 0, 0.3))}"/>`;
  return veu + A + B + C + (kC >= 1 ? data : "") + extra + varre(T, 2.55, cor);
}

// raios de explosão alternados atrás do logo
function raios(cx, cy, cor, giro) {
  const fatias = Array.from({ length: 18 }, (_, i) => { const a0 = ((i * 20 + giro) * Math.PI) / 180, a1 = a0 + (10 * Math.PI) / 180, r = 1400;
    return `M${cx},${cy} L${f1(cx + Math.cos(a0) * r)},${f1(cy + Math.sin(a0) * r)} L${f1(cx + Math.cos(a1) * r)},${f1(cy + Math.sin(a1) * r)} Z`; }).join("");
  return `<path d="${fatias}" fill="${cor.amarelo}" opacity="0.85"/>`;
}

export function cenaLogo(T, story, cor, logoUri) {
  if (T < 3 || T >= 5.5) return "";
  const conta = story.conta || story.banda, lado = 500, cx = 540, cy = 690, fx = cx - lado / 2, fy = cy - lado / 2;
  const kp = p(T, 3.0, 0.4, pop), kl = p(T, 3.2, 0.45, pop), cl = novoId("wl");
  const img = logoUri
    ? `<clipPath id="${cl}"><rect x="${fx}" y="${fy}" width="${lado}" height="${lado}"/></clipPath><image href="${logoUri}" x="${fx}" y="${fy}" width="${lado}" height="${lado}" clip-path="url(#${cl})" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect x="${fx}" y="${fy}" width="${lado}" height="${lado}" fill="${cor.piscina}"/>${linhasDoNome(story.banda, 9).map((l, i, a) =>
      txt(cx, cy + (i - (a.length - 1) / 2) * 96 + 34, l, cabe(l, lado - 70, 92), "#fff", { contorno: [cor.linha, 8] })).join("")}`;
  const foto = kl > 0 ? `<g transform="translate(${cx} ${cy}) rotate(${f1(lerp(-12, -3, Math.min(1, kl)))}) scale(${kl.toFixed(3)}) translate(${-cx} ${-cy})">
    <rect x="${fx - 18}" y="${fy - 18}" width="${lado + 36}" height="${lado + 36}" fill="${cor.sombra}" opacity="${cor.sombraOp}" transform="translate(12 14)"/>
    <rect x="${fx - 18}" y="${fy - 18}" width="${lado + 36}" height="${lado + 36}" fill="#fff" stroke="${cor.linha}" stroke-width="6"/>${img}
    <rect x="${fx}" y="${fy}" width="${lado}" height="${lado}" fill="none" stroke="${cor.linha}" stroke-width="3"/></g>` : "";
  const P = painel(70, 250, 940, 880, cor, { fill: cor.piscina, pontos: [cor.ponto, 18, 3.2, 0.3], k: kp, origem: "c" }, raios(cx, cy, cor, T * 6) + foto);
  const ko = p(T, 3.55, 0.4, pop), tchan = "TCHAN!";
  const ono = estrela(820, 330, 170, 120, 16, cor.laranja, cor, { semente: 7, k: ko, rot: -6 }) +
    (ko > 0.5 ? txt(820, 360, tchan, cabe(tchan, 250, 88), cor.amarelo, { rot: -8, contorno: [cor.linha, 10] }) : "");
  // recordatórios: @conta e a máquina batendo estrada e base
  const k1 = p(T, 3.5, 0.35, enter), fc = cabe(conta, 800, 64);
  const r1 = k1 > 0 ? `<g opacity="${op3(k1)}" transform="translate(${f1((1 - k1) * -40)} 0)">${legenda(110, 1180, 860, 110, cor, cor.amarelo, txt(540, 1235 + fc * 0.36, conta, fc, cor.linha), -1)}</g>` : "";
  const l1 = story.desde ? `Na estrada desde ${story.desde}.` : "", l2 = story.cidadeBase ? `base: ${story.cidadeBase}` : "";
  const fl = Math.min(cabe(l1 || "x", 720, 44, "semi", 2), cabe(l2 || "x", 720, 44, "semi", 2));
  const kt = p(T, 3.85, 0.7, (x) => x), kt2 = p(T, 4.5, 0.6, (x) => x), linhas = [l1, l2].filter(Boolean);
  const r2 = linhas.length && T >= 3.8 ? legenda(140, 1330, 800, 70 + linhas.length * 64, cor, cor.balao,
    (l1 ? datilo(176, 1392, batido(l1, kt), fl, cor.linha, { T, cursor: kt < 1 }) : "") +
    (l2 ? datilo(176, 1392 + (l1 ? 64 : 0), batido(l2, l1 ? kt2 : kt), fl, cor.linha, { T, cursor: (l1 ? kt2 : kt) > 0 && T < 5.3 }) : ""), 1) : "";
  return fundo(cor) + P + ono + r1 + r2;
}
