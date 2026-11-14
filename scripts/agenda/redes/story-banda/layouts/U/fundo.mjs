// Layout U: céu cinza frio de inverno seco (degradê, sol pálido sem calor, faixas de névoa e grão) e galhos secos em
// traço fino, gerados por recursão determinística (sem Math.random) uma vez no import. Os galhos balançam de leve com T.
import { p, enter, lerp } from "../../tempo.mjs";
import { rnd, novoId, f1, grao } from "./pecas.mjs";

// Galho: segmento levemente curvo; filhos (2, às vezes 3) abrem em ângulo, encurtam e afinam. Agrupa por espessura
// (meio px) num path só por espessura, pra o SVG ficar leve.
function arvore(x, y, ang, len, w, prof, seed) {
  const porLargura = new Map();
  const ramo = (x0, y0, a, l, lw, d, s) => {
    const curva = (rnd(s) - 0.5) * 0.5, a2 = a + curva;
    const x1 = x0 + Math.cos(a2) * l, y1 = y0 + Math.sin(a2) * l;
    const cx = x0 + Math.cos(a - curva) * l * 0.5, cy = y0 + Math.sin(a - curva) * l * 0.5, chave = Math.max(0.6, Math.round(lw * 2) / 2);
    porLargura.set(chave, (porLargura.get(chave) || "") + `M${f1(x0)},${f1(y0)}Q${f1(cx)},${f1(cy)} ${f1(x1)},${f1(y1)}`);
    if (d <= 0 || l < 12) return;
    const filhos = rnd(s + 7) > 0.72 ? 3 : 2;
    for (let i = 0; i < filhos; i++) {
      const lado = filhos === 2 ? (i ? 1 : -1) : i - 1, abre = (0.28 + 0.35 * rnd(s * 3 + i)) * lado + (rnd(s + i + 11) - 0.5) * 0.2;
      ramo(x1, y1, a2 + abre, l * (0.66 + 0.16 * rnd(s * 5 + i)), lw * 0.64, d - 1, s * 2 + i + 3);
    }
    // gravetinho lateral no meio do segmento
    if (d < 4 && rnd(s + 21) > 0.4) {
      const lado = rnd(s + 23) > 0.5 ? 1 : -1, gx = (x0 + x1) / 2, gy = (y0 + y1) / 2, ga = a2 + lado * (0.7 + 0.4 * rnd(s + 29)), gl = l * 0.35;
      const k2 = Math.max(0.6, Math.round(lw * 0.9) / 2);
      porLargura.set(k2, (porLargura.get(k2) || "") + `M${f1(gx)},${f1(gy)}L${f1(gx + Math.cos(ga) * gl)},${f1(gy + Math.sin(ga) * gl)}`);
    }
  };
  ramo(x, y, ang, len, w, prof, seed);
  return { x, y, caminhos: [...porLargura].sort((a, b) => b[0] - a[0]) };
}

const rad = (g) => (g * Math.PI) / 180;
// três árvores: canto de baixo à esquerda subindo, borda direita entrando, canto de cima à esquerda pendendo
const ARVORES = [arvore(-30, 1980, rad(-68), 330, 18, 8, 3), arvore(1110, 300, rad(196), 260, 12, 7, 9), arvore(-20, 120, rad(-6), 230, 10, 7, 17)];

export function galhos(T, cor, { op = 0.8, quais = [0, 1, 2] } = {}) {
  return quais.map((i) => {
    const a = ARVORES[i], giro = Math.sin(T * 0.9 + i * 2.1) * 0.5;
    const tracos = a.caminhos.map(([lw, d]) => `<path d="${d}" stroke-width="${lw}"/>`).join("");
    return `<g transform="rotate(${giro.toFixed(3)} ${a.x} ${a.y})" fill="none" stroke-linecap="round">
      <g stroke="#000" opacity="${(op * 0.25).toFixed(3)}" transform="translate(4 6)">${tracos}</g><g stroke="${cor.galho}" opacity="${op}">${tracos}</g></g>`;
  }).join("");
}

// Céu frio: degradê, sol pálido, duas faixas de névoa e grão
export function ceu(cor) {
  const g = novoId("uk"), s = novoId("us"), n = novoId("un");
  return `<linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cor.ceu}"/><stop offset="1" stop-color="${cor.ceu2}"/></linearGradient>
    <radialGradient id="${s}"><stop offset="0" stop-color="${cor.sol}" stop-opacity="0.55"/><stop offset="0.25" stop-color="${cor.sol}" stop-opacity="0.22"/><stop offset="1" stop-color="${cor.sol}" stop-opacity="0"/></radialGradient>
    <rect width="1080" height="1920" fill="url(#${g})"/><circle cx="790" cy="260" r="360" fill="url(#${s})"/>
    <linearGradient id="${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cor.sol}" stop-opacity="0"/><stop offset="0.5" stop-color="${cor.sol}" stop-opacity="0.06"/><stop offset="1" stop-color="${cor.sol}" stop-opacity="0"/></linearGradient>
    <rect y="480" width="1080" height="220" fill="url(#${n})"/><rect y="1340" width="1080" height="300" fill="url(#${n})"/>${grao(cor.grao, cor.graoOp)}`;
}

export const fundo = (T, cor) => ceu(cor) + galhos(T, cor);

// Troca de cena da abertura: o céu sobe e cobre o clipe
export const varre = (T, at, cor) => {
  const y = lerp(1920, 0, p(T, at, 0.45, enter));
  return y < 1920 ? `<g transform="translate(0 ${f1(y)})">${fundo(T, cor)}</g>` : "";
};
