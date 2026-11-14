// Layout O: 5 bonequinhos em silhueta chapada, um braço de cada erguido até as mãos se juntarem no alto, no centro.
// Pose de grupo genérica em desenho (homenagem ao clima do Ten, sem foto, sem pessoa real, sem logo). Animação: o
// grupo sobe, os braços levantam até as mãos se tocarem e todos dão um pulinho junto. Função pura de T.
import { p, pop, enter, lerp } from "../../tempo.mjs";

// x relativo ao centro (em H), lado do braço erguido, cabelo, pernas (abertura e joelho dobrado), profundidade
const GRUPO = [
  { x: -0.62, cabelo: "longo", abre: 0.16, dobra: 0, fundo: true },
  { x: -0.3, cabelo: "curto", abre: 0.1, dobra: 0.18, fundo: false },
  { x: 0.02, cabelo: "cacheado", abre: 0.13, dobra: 0, fundo: false },
  { x: 0.33, cabelo: "longo", abre: 0.09, dobra: 0.22, fundo: false },
  { x: 0.64, cabelo: "boné", abre: 0.15, dobra: 0, fundo: true },
];

const cabeca = (x, y, r, tipo) => {
  if (tipo === "longo") return `<path d="M${x - r * 1.05},${y} Q${x - r * 1.2},${y + r * 2.4} ${x - r * 0.5},${y + r * 2.2} L${x + r * 0.5},${y + r * 2.2} Q${x + r * 1.2},${y + r * 2.4} ${x + r * 1.05},${y} Z"/><circle cx="${x}" cy="${y}" r="${r * 1.08}"/>`;
  if (tipo === "cacheado") return [[-0.7, -0.5], [0, -0.85], [0.7, -0.5], [-0.85, 0.25], [0.85, 0.25]].map(([a, b]) => `<circle cx="${x + a * r}" cy="${y + b * r}" r="${r * 0.62}"/>`).join("") + `<circle cx="${x}" cy="${y}" r="${r}"/>`;
  if (tipo === "boné") return `<circle cx="${x}" cy="${y}" r="${r}"/><path d="M${x - r * 1.05},${y - r * 0.15} Q${x},${y - r * 1.5} ${x + r * 1.05},${y - r * 0.15} L${x + r * 1.7},${y - r * 0.05} L${x + r * 1.05},${y + r * 0.12} Z"/>`;
  return `<circle cx="${x}" cy="${y}" r="${r}"/>`;
};

// membro afinando de a (grossura wa) até b (grossura wb), com juntas redondas
const membro = (a, b, wa, wb) => {
  const ang = Math.atan2(b.y - a.y, b.x - a.x), nx = -Math.sin(ang), ny = Math.cos(ang), f = (v) => v.toFixed(1);
  return `<path d="M${f(a.x + nx * wa / 2)},${f(a.y + ny * wa / 2)} L${f(b.x + nx * wb / 2)},${f(b.y + ny * wb / 2)} L${f(b.x - nx * wb / 2)},${f(b.y - ny * wb / 2)} L${f(a.x - nx * wa / 2)},${f(a.y - ny * wa / 2)} Z"/>` +
    `<circle cx="${f(a.x)}" cy="${f(a.y)}" r="${f(wa / 2)}"/><circle cx="${f(b.x)}" cy="${f(b.y)}" r="${f(wb / 2)}"/>`;
};

// mão aberta na ponta do antebraço: palma, 4 dedos e polegar, apontando na direção do braço (graus)
const maoDesenho = (x, y, ang, u, espelha) => {
  const dedos = [[-0.42, 0.95], [-0.14, 1.1], [0.14, 1.05], [0.4, 0.85]].map(([dx, hh]) => `<rect x="${(dx * u - u * 0.13).toFixed(1)}" y="${(-u * 0.55 - hh * u).toFixed(1)}" width="${(u * 0.26).toFixed(1)}" height="${(hh * u + u * 0.2).toFixed(1)}" rx="${(u * 0.13).toFixed(1)}"/>`).join("");
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)}) scale(${espelha ? -1 : 1} 1)">
    <rect x="${(-u * 0.6).toFixed(1)}" y="${(-u * 0.75).toFixed(1)}" width="${(u * 1.2).toFixed(1)}" height="${(u * 0.95).toFixed(1)}" rx="${(u * 0.35).toFixed(1)}"/>${dedos}
    <rect x="${(-u * 0.74).toFixed(1)}" y="${(-u * 0.95).toFixed(1)}" width="${(u * 0.28).toFixed(1)}" height="${(u * 0.85).toFixed(1)}" rx="${(u * 0.14).toFixed(1)}" transform="rotate(-28 ${(-u * 0.6).toFixed(1)} ${(-u * 0.15).toFixed(1)})"/></g>`;
};

// onde cada mão para no alto (em H, relativo ao ponto de encontro): escalonadas, uma segurando a outra
const PONTAS = [[-0.13, 0.12], [-0.06, 0.0], [0.0, -0.09], [0.06, 0.0], [0.13, 0.12]];

// cx = centro do grupo, chao = y dos pés, H = altura de um boneco
export function bonecos(T, { cx, chao, H, at, cor }) {
  const k = p(T, at, 0.6, enter);
  if (k <= 0) return "";
  const braco = p(T, at + 0.35, 0.55, pop), pulo = T > at + 1 ? Math.abs(Math.sin((T - at - 1) * 4.2)) * Math.max(0, 1 - (T - at - 1) / 1.6) : 0;
  const sobe = lerp(H * 1.3, 0, k), dy = sobe - pulo * H * 0.12;
  const ombroY = chao - H * 0.78, encontro = { x: cx, y: ombroY - H * 0.5 };
  const w = H * 0.075; // grossura do traço
  const um = (g, i) => {
    const hx = cx + g.x * H, ox = lerp(hx, cx, 0.18), oy = ombroY + dy, quadril = chao - H * 0.42 + dy, pe = chao + dy;
    const ergueEsq = g.x > 0; // quem está à direita ergue o braço esquerdo, em direção ao centro
    const sx = ox + (ergueEsq ? -1 : 1) * H * 0.07, livre = ox + (ergueEsq ? 1 : -1) * H * 0.07;
    const [px, py] = PONTAS[i];
    const mao = { x: lerp(sx + (ergueEsq ? -1 : 1) * H * 0.1, encontro.x + px * H, braco), y: lerp(oy + H * 0.32, encontro.y + dy + py * H, braco) };
    const cotovelo = { x: (sx + mao.x) / 2 + (ergueEsq ? 1 : -1) * H * 0.035, y: (oy + mao.y) / 2 };
    const ombro = { x: sx, y: oy }, angMao = Math.atan2(mao.y - cotovelo.y, mao.x - cotovelo.x) * 180 / Math.PI + 90;
    const joelhoD = g.dobra * H;
    const pernas = [-1, 1].map((l) => `<path d="M${hx + l * H * 0.04},${quadril} L${hx + l * H * g.abre * 0.7 + (l > 0 ? joelhoD * 0.4 : 0)},${quadril + H * 0.22 - (l > 0 ? joelhoD * 0.3 : 0)} L${hx + l * H * g.abre},${pe - (l > 0 ? joelhoD * 0.5 : 0)}"/>`).join("");
    const traco = `fill="none" stroke="${cor.mao}" stroke-width="${w.toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"`;
    return `<g opacity="${g.fundo ? 0.72 : 1}"><g ${traco}>${pernas}<path d="M${ox},${oy} L${hx},${quadril}" stroke-width="${(w * 1.9).toFixed(1)}"/>
      <path d="M${livre},${oy} L${livre + (ergueEsq ? 1 : -1) * H * 0.08},${oy + H * 0.2} L${livre + (ergueEsq ? 1 : -1) * H * 0.04},${oy + H * 0.36}"/></g>
      <g fill="${cor.mao}">${cabeca(ox + (cx - ox) * 0.05, oy - H * 0.13, H * 0.075, g.cabelo)}${membro(ombro, cotovelo, w * 1.15, w * 0.85)}${membro(cotovelo, mao, w * 0.85, w * 0.55)}${maoDesenho(mao.x, mao.y, angMao, w * 1.25, ergueEsq)}</g></g>`;
  };
  // contraluz atrás do grupo (destaca a silhueta sobre o clipe e no tema escuro)
  const luz = `<radialGradient id="obl"><stop offset="0" stop-color="${cor.luz}" stop-opacity="0.75"/><stop offset="1" stop-color="${cor.luz}" stop-opacity="0"/></radialGradient>
    <ellipse cx="${cx}" cy="${(ombroY + dy).toFixed(1)}" rx="${(H * 1.25).toFixed(1)}" ry="${(H * 0.95).toFixed(1)}" fill="url(#obl)" opacity="${k.toFixed(3)}"/>`;
  // os do fundo primeiro, os da frente por cima
  return luz + GRUPO.map((g, i) => [g, i]).sort((a, b) => Number(b[0].fundo) - Number(a[0].fundo)).map(([g, i]) => um(g, i)).join("");
}
