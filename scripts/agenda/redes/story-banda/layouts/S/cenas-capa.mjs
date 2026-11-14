// Layout S, cenas 1 (placa verde de rodovia vem crescendo pela estrada com "HOJE TEM", o nome da banda e a data, por
// cima do clipe, 0 a 3) e 2 (placa grande presa nos postes com o logo, a conta, desde quando toca e a base, 3 a 5.5).
import { p, pop, enter, lerp, clamp } from "../../tempo.mjs";
import { linhasDoNome } from "../G/placas.mjs";
import { placa, poste, abracadeira, preferencia, marcoKm, seta, texto, cabe, kmDe, novoId, f1 } from "./pecas.mjs";
import { paisagem, climaPorCima } from "./estrada.mjs";

const DIAS = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
export const dataPlaca = (dia) => `${DIAS[new Date(`${dia}T12:00:00Z`).getUTCDay()]}, ${dia.slice(8)}/${dia.slice(5, 7)}`;

// Placa da abertura em coordenadas finais (a escala da aproximação é aplicada por fora)
function placaHoje(story, cor) {
  const linhas = linhasDoNome(story.banda, 12), N = story.shows.length, x = 90, w = 900, y = 270;
  const f = Math.min(150, ...linhas.map((l) => cabe(l, 790, 150))), passo = f * 1.06;
  const yNome = y + 172, yLinha = yNome + linhas.length * passo + 14, h = yLinha - y + 150;
  const data = `${dataPlaca(story.dia)}${N > 1 ? ` · ${N} SHOWS` : ""}`;
  const miolo = texto(540, y + 104, "HOJE TEM", 64, cor.branco, { ls: 10 }) +
    `<rect x="${x + 60}" y="${y + 140}" width="${w - 120}" height="5" rx="2" fill="${cor.branco}"/>` +
    linhas.map((l, i) => texto(540, yNome + (i + 0.8) * passo, l, f, cor.branco)).join("") +
    `<rect x="${x + 60}" y="${f1(yLinha)}" width="${w - 120}" height="5" rx="2" fill="${cor.branco}"/>` +
    seta(x + 120, yLinha + 78, 0.72, 0, cor.branco) + texto(x + 190, yLinha + 98, data, cabe(data, w - 270, 56, "b"), cor.branco, { fonte: "b", anchor: "start" });
  const pes = [x + 210, x + w - 210].map((px) => poste(px, y + h - 10, 2400, 30, cor) + abracadeira(px, y + h - 40, 26, cor)).join("");
  return pes + placa({ x, y, w, h, cor }, miolo);
}

export function abertura(T, story, cor) {
  if (T >= 3) return "";
  // aproximação: a profundidade cai de 14 pra 1, a escala é 1/z, centrada no fundo da estrada do clipe
  const k = p(T, 0.05, 1.0, enter), z = lerp(14, 1, k), s = 1 / z, vx = 540, vy = 1000;
  const op = clamp((T - 0.05) / 0.25).toFixed(3), tremor = Math.sin(T * 40) * 1.5 * (1 - k);
  const veu = `<rect width="1080" height="1920" fill="#000" opacity="${(0.32 * p(T, 0, 0.3, enter)).toFixed(3)}"/>`;
  const grupo = `<g opacity="${op}" transform="translate(${vx} ${f1(vy + tremor)}) scale(${s.toFixed(4)}) translate(${-vx} ${-vy})">${placaHoje(story, cor)}</g>`;
  const y = lerp(1920, 0, p(T, 2.5, 0.5, enter));
  const varre = y < 1920 ? `<g transform="translate(0 ${f1(y)})">${paisagem(T, cor, { hz: 1420, vel: 0.6 })}</g>` : "";
  return veu + grupo + varre;
}

// sem logo: o nome da banda em até 4 linhas no quadrado
function reserva(banda, cy, larg, cor) {
  const l = linhasDoNome(banda, 10), f = Math.min(130, ...l.map((t) => cabe(t, larg, 130))), passo = f * 1.06;
  return l.map((t, i) => texto(540, cy - (l.length * passo) / 2 + (i + 0.8) * passo, t, f, cor.branco)).join("");
}

export function cenaLogo(T, story, cor, logoUri) {
  if (T < 3 || T >= 5.5) return "";
  const conta = story.conta || story.banda, x = 120, w = 840, y = 250, h = 1000, lado = 540, ix = 540 - lado / 2, iy = y + 70;
  const kp = p(T, 3.05, 0.55, pop), dy = (1 - kp) * 1100, kt = p(T, 3.45, 0.4, enter), cl = novoId("sl");
  const img = logoUri
    ? `<clipPath id="${cl}"><rect x="${ix}" y="${iy}" width="${lado}" height="${lado}" rx="10"/></clipPath><image href="${logoUri}" x="${ix}" y="${iy}" width="${lado}" height="${lado}" clip-path="url(#${cl})" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect x="${ix}" y="${iy}" width="${lado}" height="${lado}" rx="10" fill="${cor.placa2}"/>${reserva(story.banda, iy + lado / 2, lado - 80, cor)}`;
  const l2 = story.desde ? `Na estrada desde ${story.desde}` : "", l3 = story.cidadeBase ? `Base: ${story.cidadeBase}` : "";
  const linhas = [l2, l3].filter(Boolean);
  const miolo = img + `<rect x="${ix}" y="${iy}" width="${lado}" height="${lado}" rx="10" fill="none" stroke="${cor.branco}" stroke-width="8"/>` +
    `<g opacity="${kt.toFixed(3)}">${texto(540, iy + lado + 112, conta, cabe(conta, w - 110, 76), cor.branco)}
    <rect x="${x + 70}" y="${iy + lado + 150}" width="${w - 140}" height="4" rx="2" fill="${cor.branco}" opacity="0.9"/>
    ${linhas.map((l, i) => texto(540, iy + lado + 222 + i * 64, l, cabe(l, w - 130, 48, "b"), cor.branco, { fonte: "b" })).join("")}</g>`;
  const hh = Math.min(h, iy + lado + 196 + linhas.length * 64 - y + 34);
  const pes = [x + 200, x + w - 200].map((px) => poste(px, y + hh - 10, 2100, 34, cor) + abracadeira(px, y + hh - 44, 30, cor)).join("");
  const km = kmDe(story.banda);
  return paisagem(T, cor, { hz: 1420, vel: 0.6 }) + preferencia(110, 1330, 0.62, cor, 1600) + marcoKm(985, 1520, 0.8, km, cor) +
    `<g transform="translate(0 ${f1(dy)})">${pes}${placa({ x, y, w, h: hh, cor }, miolo)}</g>` + climaPorCima(T, cor);
}
