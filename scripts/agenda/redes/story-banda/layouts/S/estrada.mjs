// Layout S: a paisagem da viagem. Céu amplo (sol, pôr do sol, lua com estrelas ou chuva), serra baixa e campo aberto
// com as linhas da plantação fugindo pro horizonte, asfalto em perspectiva com faixa amarela tracejada, linhas brancas
// de bordo e balizadores que correm com o tempo (vel), farol à noite, neblina e chuva. Função pura de T.
import { grao, novoId, f1, rnd } from "./pecas.mjs";

// perspectiva: profundidade z (1 = pé da tela) vira altura y e meia largura da pista
const yDe = (hz, z) => hz + (1920 - hz) / z;
const pista = (z) => 640 / z;

// nuvens fixas (cx, cy em fração do céu, rx, ry): leves, borradas, andando devagar
const NUVENS = [[0.18, 0.28, 210, 46], [0.74, 0.18, 260, 52], [0.52, 0.52, 170, 30], [0.92, 0.6, 140, 26], [0.05, 0.66, 120, 22]];
const ESTRELAS = Array.from({ length: 90 }, (_, i) => [rnd(i + 900) * 1080, rnd(i + 1000), 0.6 + rnd(i + 1100) * 1.6]);
const GOTAS = Array.from({ length: 150 }, (_, i) => [rnd(i + 1300) * 1180 - 50, rnd(i + 1400) * 1920, 30 + rnd(i + 1500) * 50]);

function ceu(T, cor, hz) {
  const g = novoId("sc"), h = novoId("sh"), bl = novoId("sbl");
  let astro = "";
  const ya = hz < 1400 ? hz * 0.3 : 210; // horizonte baixo: o astro sobe pra não brigar com o pórtico
  if (cor.astro === "sol") astro = `<circle cx="830" cy="${f1(ya)}" r="160" fill="${cor.sol}" opacity="0.18"/><circle cx="830" cy="${f1(ya)}" r="62" fill="${cor.sol}"/>`;
  if (cor.astro === "poente") { const s = novoId("ss");
    astro = `<radialGradient id="${s}"><stop offset="0" stop-color="${cor.sol}" stop-opacity="0.7"/><stop offset="1" stop-color="${cor.sol}" stop-opacity="0"/></radialGradient>
      <circle cx="380" cy="${hz - 30}" r="520" fill="url(#${s})"/><circle cx="380" cy="${hz - 30}" r="150" fill="${cor.sol}"/>
      ${[0, 1, 2, 3].map((i) => `<rect x="200" y="${hz - 70 + i * 16}" width="360" height="${3 + i}" fill="${cor.ceu2}" opacity="0.8"/>`).join("")}`; }
  if (cor.astro === "lua") astro = ESTRELAS.filter(([, b]) => b * hz < hz - 60).map(([a, b, r], i) =>
    `<circle cx="${f1(a)}" cy="${f1(b * hz)}" r="${f1(r)}" fill="#fff" opacity="${f1(0.35 + 0.5 * Math.abs(Math.sin(T * 2 + i)))}"/>`).join("") +
    `<radialGradient id="${bl}h"><stop offset="0" stop-color="#dfe6ff" stop-opacity="0.25"/><stop offset="1" stop-color="#dfe6ff" stop-opacity="0"/></radialGradient>
    <mask id="${bl}m"><rect width="1080" height="${hz}" fill="#fff"/><circle cx="818" cy="${f1(ya - 12)}" r="42" fill="#000"/></mask>
    <circle cx="800" cy="${f1(ya)}" r="150" fill="url(#${bl}h)"/><circle cx="800" cy="${f1(ya)}" r="46" fill="#eef1ff" mask="url(#${bl}m)"/>`;
  const nuvens = cor.nuvem ? `<filter id="${bl}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16"/></filter><g filter="url(#${bl})" fill="${cor.nuvem}">` +
    NUVENS.map(([a, b, rx, ry], i) => { const x = ((a * 1080 + T * (8 + i * 3)) % 1300) - 110;
      return `<ellipse cx="${f1(x)}" cy="${f1(b * hz)}" rx="${rx}" ry="${ry}" opacity="0.7"/><ellipse cx="${f1(x + rx * 0.4)}" cy="${f1(b * hz - ry * 0.6)}" rx="${f1(rx * 0.5)}" ry="${ry}" opacity="0.6"/>`; }).join("") + "</g>" : "";
  return `<linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cor.ceu1}"/><stop offset="1" stop-color="${cor.ceu2}"/></linearGradient>
    <linearGradient id="${h}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cor.ceu2}" stop-opacity="0"/><stop offset="1" stop-color="${cor.bruma}" stop-opacity="0.7"/></linearGradient>
    <rect width="1080" height="${hz}" fill="url(#${g})"/>${astro}${nuvens}<rect y="${hz - 220}" width="1080" height="220" fill="url(#${h})"/>`;
}

// serra baixa no horizonte e fileira de árvores (perfil fixo, determinístico)
function horizonte(cor, hz) {
  const serra = Array.from({ length: 13 }, (_, i) => `${f1(i * 90)},${f1(hz - 18 - rnd(i + 40) * 46)}`).join(" L");
  const arv = Array.from({ length: 34 }, (_, i) => { const x = rnd(i + 60) * 1080, r = 5 + rnd(i + 80) * 9;
    return Math.abs(x - 540) < 60 ? "" : `<ellipse cx="${f1(x)}" cy="${f1(hz - r * 0.7)}" rx="${f1(r * 1.3)}" ry="${f1(r)}"/>`; }).join("");
  return `<path d="M0,${hz} L${serra} L1080,${hz} Z" fill="${cor.serra}" opacity="0.75"/><g fill="${cor.arvore}">${arv}</g>`;
}

function campo(cor, hz) {
  const g = novoId("sf");
  const sulcos = Array.from({ length: 40 }, (_, i) => { const a = (i - 19.5) * 130;
    return Math.abs(a) < 900 ? "" : `M${f1(540 + a * 0.012)},${hz} L${f1(540 + a)},1920`; }).join("");
  return `<linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cor.campo1}"/><stop offset="1" stop-color="${cor.campo2}"/></linearGradient>
    <rect y="${hz}" width="1080" height="${1920 - hz}" fill="url(#${g})"/><path d="${sulcos}" stroke="${cor.campo2}" stroke-width="3" opacity="0.35"/>
    ${grao(cor.campo2, 0.35, 0, hz, 1080, 1920 - hz)}`;
}

// trapézio entre as profundidades z1 > z2, deslocado do centro por `lado` (em unidades da pista)
const faixa = (hz, z1, z2, lado, meia) => {
  const p = (z, s) => `${f1(540 + (lado + s * meia) * pista(z) / 640 * 640)},${f1(yDe(hz, z))}`;
  return `M${p(z1, -1)} L${p(z1, 1)} L${p(z2, 1)} L${p(z2, -1)} Z`;
};

function asfalto(T, cor, hz, vel) {
  const g = novoId("sa"), o = (T * vel * 2.2) % 3, tracos = [], balizas = [];
  for (let k = 0; k < 40; k++) {
    const z1 = 0.55 + k * 3 - o, z2 = z1 + 1.3;
    if (z1 > 0.55 && z1 < 80) tracos.push(faixa(hz, z1, z2, 0, 0.018));
    const zb = 0.6 + k * 3 - o + 1.5;
    if (zb > 0.6 && zb < 60) for (const s of [-1, 1]) { const x = 540 + s * pista(zb) * 1.32, y = yDe(hz, zb), hh = 150 / zb, w = 16 / zb;
      balizas.push(`<rect x="${f1(x - w / 2)}" y="${f1(y - hh)}" width="${f1(w)}" height="${f1(hh)}" fill="${cor.baliza}"/><rect x="${f1(x - w / 2)}" y="${f1(y - hh * 0.86)}" width="${f1(w)}" height="${f1(hh * 0.16)}" fill="${s < 0 ? cor.faixa : cor.vermelhoPlaca}"/>`); }
  }
  const acost = `M${f1(540 - 6)},${hz} L${f1(540 + 6)},${hz} L${f1(540 + 820)},1920 L${f1(540 - 820)},1920 Z`;
  const pist = `M${f1(540 - 4)},${hz} L${f1(540 + 4)},${hz} L${f1(540 + 660)},1920 L${f1(540 - 660)},1920 Z`;
  const farol = cor.farol ? `<radialGradient id="${g}f" cx="0.5" cy="1" r="0.9"><stop offset="0" stop-color="${cor.farol}" stop-opacity="0.5"/><stop offset="1" stop-color="${cor.farol}" stop-opacity="0"/></radialGradient>
    <path d="M${540 - 120},${hz + (1920 - hz) * 0.25} L${540 + 120},${hz + (1920 - hz) * 0.25} L${540 + 700},1920 L${540 - 700},1920 Z" fill="url(#${g}f)"/>` : "";
  const molhado = cor.molhado ? `<path d="${pist}" fill="url(#${g}m)" opacity="0.5"/><linearGradient id="${g}m" x1="0" x2="1"><stop offset="0.3" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.35"/><stop offset="0.7" stop-color="#fff" stop-opacity="0"/></linearGradient>` : "";
  return `<linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cor.asfalto2}"/><stop offset="1" stop-color="${cor.asfalto1}"/></linearGradient>
    <path d="${acost}" fill="${cor.acostamento}"/><path d="${pist}" fill="url(#${g})"/>${grao("#000", 0.3, 0, hz, 1080, 1920 - hz)}${grao("#fff", 0.08, 0, hz, 1080, 1920 - hz)}${molhado}
    <path d="${faixa(hz, 0.5, 90, -0.93, 0.012)}${faixa(hz, 0.5, 90, 0.93, 0.012)}" fill="${cor.borda}" opacity="0.9"/>
    <path d="${tracos.join("")}" fill="${cor.faixa}"/>${farol}${balizas.reverse().join("")}`;
}

function clima(T, cor, hz) {
  const n = novoId("sn");
  const neblina = cor.neblina ? `<linearGradient id="${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cor.bruma}" stop-opacity="0"/><stop offset="0.5" stop-color="${cor.bruma}" stop-opacity="${cor.neblina}"/><stop offset="1" stop-color="${cor.bruma}" stop-opacity="0"/></linearGradient>
    <rect y="${hz - 380}" width="1080" height="760" fill="url(#${n})"/>` : "";
  const chuva = cor.chuva ? `<path d="${GOTAS.map(([x, y, l]) => { const yy = (y + T * 1900) % 2000 - 60;
    return `M${f1(x + yy * 0.12)},${f1(yy)} l${f1(-l * 0.12)},${f1(-l)}`; }).join("")}" stroke="#fff" stroke-width="1.4" opacity="0.35" stroke-linecap="round"/>` : "";
  return neblina + chuva;
}

// paisagem inteira. hz = altura do horizonte; vel = quanto a estrada corre (0 = parada)
export const paisagem = (T, cor, { hz = 1100, vel = 1 } = {}) => ceu(T, cor, hz) + horizonte(cor, hz) + campo(cor, hz) + asfalto(T, cor, hz, vel) + clima(T, cor, hz);
// só o tempo (chuva/neblina) por cima das placas
export const climaPorCima = (T, cor) => (cor.chuva ? clima(T, { ...cor, neblina: 0 }, 0) : "");
export { yDe, pista };
