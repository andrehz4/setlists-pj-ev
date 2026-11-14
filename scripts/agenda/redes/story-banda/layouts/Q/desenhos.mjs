// Layout Q: pranchas de livro velho de medicina em traço de gravura (linha fina e hachura), genéricas: coração,
// mão com as linhas da palma, perfil de cabeça com áreas numeradas e rosa dos ventos. `k` (0..1) desenha o traço
// aos poucos (stroke-dashoffset), como se a pena estivesse riscando.
import { novoId, f1, serif } from "./pecas.mjs";

const traco = (d, tinta, w, k = 1, extra = "") => `<path d="${d}" fill="none" stroke="${tinta}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"
  pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${f1(1 - k)}" ${extra}/>`;

// hachura a 30 graus dentro de um caminho de recorte
function hachura(id, d, tinta, { passo = 9, w = 1.1, op = 0.8, caixa = [-120, -160, 240, 320] } = {}) {
  const [x0, y0, cw, ch] = caixa, linhas = [];
  for (let c = -ch; c < cw + ch; c += passo) linhas.push(`M${x0 + c},${y0} l${-ch * 0.58},${ch}`);
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><path d="${linhas.join("")}" clip-path="url(#${id})" stroke="${tinta}" stroke-width="${w}" opacity="${op}" fill="none"/>`;
}

// Coração anatômico estilizado (caixa ~ 200 x 260 em s = 1)
export function coracao(cx, cy, s, tinta, k = 1) {
  const corpo = "M-10,-40 C-62,-62 -98,-18 -86,32 C-74,82 -22,110 16,142 C42,100 92,70 92,18 C92,-32 52,-56 10,-40 Z";
  const sombra = "M30,-38 C70,-40 96,-10 92,20 C88,66 46,100 16,142 C40,80 52,20 30,-38 Z";
  return `<g transform="translate(${cx} ${cy}) scale(${s})">${hachura(novoId("qh"), sombra, tinta, { op: 0.7 * k })}
    ${traco(corpo, tinta, 2.4, k)}
    ${traco("M-8,-44 C-14,-92 18,-114 52,-104 C78,-96 84,-72 72,-56 M6,-46 C2,-80 24,-96 48,-90 C62,-86 66,-74 60,-64", tinta, 1.8, k)}
    ${traco("M10,-104 L6,-138 M30,-110 L32,-146 M52,-104 L62,-136", tinta, 1.6, k)}
    ${traco("M24,-36 C28,-66 44,-74 62,-70 C74,-66 76,-56 70,-48", tinta, 1.6, k)}
    ${traco("M-30,-24 C-12,16 0,62 12,124 M-14,10 L-40,28 M-4,50 L-30,68 M4,88 L-14,104", tinta, 1.2, k)}</g>`;
}

// Mão aberta com as linhas da palma e números (caixa ~ 260 x 380 em s = 1)
export function mao(cx, cy, s, tinta, papel, k = 1) {
  const dedos = [[-66, -150, 0.95, -6], [-30, -176, 1, -2], [6, -166, 1, 2], [40, -128, 0.9, 8]].map(([x, y, , r]) =>
    `<rect x="${x}" y="${y}" width="32" height="${-y - 10}" rx="16" transform="rotate(${r} ${x + 16} -20)" fill="${papel}" stroke="${tinta}" stroke-width="2"/>
     <path d="M${x + 6},${y + 46} h20 M${x + 6},${y + 86} h20" stroke="${tinta}" stroke-width="1" opacity="0.6" transform="rotate(${r} ${x + 16} -20)"/>`).join("");
  return `<g transform="translate(${cx} ${cy}) scale(${s})" opacity="${k}">
    <rect x="-118" y="-30" width="34" height="120" rx="17" transform="rotate(-38 -84 60)" fill="${papel}" stroke="${tinta}" stroke-width="2"/>${dedos}
    <rect x="-78" y="-34" width="152" height="170" rx="46" fill="${papel}" stroke="${tinta}" stroke-width="2.2"/>
    <path d="M-80,150 h156 M-76,164 h148" stroke="${tinta}" stroke-width="1.2" opacity="0.7"/>
    ${traco("M-52,0 C-30,30 -36,80 -18,124", tinta, 1.6)}${traco("M-60,30 C-20,22 20,34 56,48", tinta, 1.4)}${traco("M-58,6 C-20,-6 30,0 64,-6", tinta, 1.4)}
    ${[["1", -10, 108], ["2", 34, 62], ["3", 48, 12]].map(([n, x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="${papel}" stroke="${tinta}" stroke-width="1.4"/>` + serif(x, y + 6, n, 18, tinta, { peso: "bold" })).join("")}</g>`;
}

// Perfil de cabeça (olhando pra direita) com áreas tracejadas e numeradas (caixa ~ 230 x 300 em s = 1)
export function cabeca(cx, cy, s, tinta, papel, k = 1) {
  const perfil = "M-56,150 C-66,96 -96,44 -96,-20 C-96,-110 -22,-152 40,-132 C86,-116 106,-72 100,-30 L114,0 C118,8 112,13 103,13 L105,30 C107,37 101,41 96,41 C101,49 97,57 89,59 C87,80 70,92 40,88 L36,150";
  const areas = ["M-90,-50 C-40,-60 20,-56 92,-46", "M-60,-112 C-40,-80 -36,-40 -30,-6", "M10,-136 C14,-100 16,-70 20,-48", "M-94,10 C-60,0 -40,-4 -30,-6"];
  const nums = [[-56, -78, "1"], [-8, -96, "2"], [52, -88, "3"], [-62, -20, "4"], [56, -14, "5"]];
  return `<g transform="translate(${cx} ${cy}) scale(${s})"><path d="${perfil}" fill="${papel}"/>${traco(perfil, tinta, 2.4, k)}
    ${areas.map((d) => traco(d, tinta, 1.2, k, 'opacity="0.75"')).join("").replace(/stroke-dasharray="1 1"/g, 'stroke-dasharray="0.02 0.015"')}
    <path d="M64,-6 C70,-12 80,-12 84,-6" fill="none" stroke="${tinta}" stroke-width="1.6" opacity="${k}"/>
    ${nums.map(([x, y, n]) => serif(x, y, n, 26, tinta, { peso: "bold", op: k })).join("")}</g>`;
}

// Rosa dos ventos de atlas: estrela de 4 pontas meio hachurada, anel e o N
export function rosaVentos(cx, cy, r, tinta, papel) {
  const ponta = (a) => { const c = Math.cos(a), s = Math.sin(a), q = r * 0.22;
    return `<path d="M0,0 L${f1(c * r)},${f1(s * r)} L${f1(-s * q)},${f1(c * q)} Z" fill="${tinta}"/><path d="M0,0 L${f1(c * r)},${f1(s * r)} L${f1(s * q)},${f1(-c * q)} Z" fill="${papel}" stroke="${tinta}" stroke-width="1.2"/>`; };
  return `<g transform="translate(${cx} ${cy})"><circle r="${r * 0.62}" fill="none" stroke="${tinta}" stroke-width="1.2"/><circle r="${r * 0.55}" fill="none" stroke="${tinta}" stroke-width="0.8"/>
    ${[0, 1, 2, 3].map((i) => ponta(-Math.PI / 2 + (i * Math.PI) / 2)).join("")}${serif(0, -r - 12, "N", r * 0.42, tinta, { peso: "bold" })}</g>`;
}
