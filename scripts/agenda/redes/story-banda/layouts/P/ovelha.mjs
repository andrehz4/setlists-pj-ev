// Layout P: a ovelha mascote, em DESENHO chapado (cartum simples, nada fotográfico). Cara comprida escura, lã em
// nuvem com contorno só por fora, orelhas caídas, olhos grandes olhando pra câmera (piscam), topete de lã e focinho
// que achata e alarga quando ela empurra a cerca. (x, y) = centro da cara; u = altura da cara. Função pura de T.
const f1 = (v) => v.toFixed(1);

// lã: [dx, dy, r] em u. Cabeça (topo e laterais) e peito (embaixo), atrás da cara.
const LA_CABECA = [[-0.46, -0.44, 0.25], [-0.22, -0.62, 0.27], [0.06, -0.69, 0.28], [0.33, -0.6, 0.26], [0.52, -0.4, 0.23],
  [-0.6, -0.18, 0.2], [0.62, -0.15, 0.2], [-0.52, 0.08, 0.19], [0.54, 0.1, 0.19]];
const LA_PEITO = [[-0.78, 0.62, 0.3], [-0.42, 0.74, 0.33], [0.0, 0.8, 0.34], [0.42, 0.74, 0.33], [0.8, 0.62, 0.3],
  [-1.08, 0.84, 0.32], [1.1, 0.84, 0.32], [-0.62, 1.02, 0.36], [0.62, 1.02, 0.36], [0.0, 1.08, 0.38]];
const TOPETE = [[-0.13, -0.4, 0.12], [0.03, -0.46, 0.135], [0.17, -0.39, 0.115], [0.03, -0.34, 0.1]];

// nuvem de lã: primeiro todas com contorno grosso, depois todas sem contorno por cima (sobra só a borda de fora),
// e uns cachinhos (arcos) por dentro pra dar textura
function nuvem(x, y, u, bolas, cor) {
  const c = (sw) => bolas.map(([dx, dy, r]) => `<circle cx="${f1(x + dx * u)}" cy="${f1(y + dy * u)}" r="${f1(r * u)}"${sw ? ` stroke="${cor.contorno}" stroke-width="${f1(sw)}"` : ""}/>`).join("");
  const cachos = bolas.map(([dx, dy, r], i) => {
    const cx = x + dx * u + (i % 2 ? -0.3 : 0.25) * r * u, cy = y + dy * u + 0.25 * r * u, rr = r * u * 0.3;
    return `<path d="M${f1(cx - rr)},${f1(cy)} A${f1(rr)},${f1(rr)} 0 0 1 ${f1(cx + rr)},${f1(cy)}"/>`;
  }).join("");
  return `<g fill="${cor.la}">${c(u * 0.045)}${c(0)}</g><g fill="none" stroke="${cor.contorno}" stroke-width="${f1(u * 0.012)}" stroke-linecap="round" opacity="0.22">${cachos}</g>`;
}

// olho: branco, pupila olhando pra frente (um tiquinho pro centro), brilho e pálpebra. pisca = 0..1 (1 = fechado)
function olho(x, y, u, lado, pisca, cor) {
  const ry = 0.088 * u * (1 - 0.92 * pisca), rx = 0.098 * u;
  const pup = pisca > 0.6 ? "" : `<circle cx="${f1(x - lado * 0.012 * u)}" cy="${f1(y + 0.012 * u)}" r="${f1(0.052 * u)}" fill="${cor.pupila}"/>
    <circle cx="${f1(x - lado * 0.012 * u + 0.02 * u)}" cy="${f1(y - 0.012 * u)}" r="${f1(0.016 * u)}" fill="#ffffff"/>`;
  return `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(Math.max(0.006 * u, ry))}" fill="${cor.olho}" stroke="${cor.pupila}" stroke-width="${f1(0.012 * u)}"/>${pup}
    <path d="M${f1(x - rx * 1.1)},${f1(y - ry - 0.012 * u)} Q${f1(x)},${f1(y - ry - 0.05 * u)} ${f1(x + rx * 1.1)},${f1(y - ry - 0.012 * u)}" fill="none" stroke="${cor.focinho}" stroke-width="${f1(0.02 * u)}" stroke-linecap="round"/>`;
}

// orelha caída pro lado (lado = -1 esquerda, 1 direita), com miolo mais claro
const orelha = (x, y, u, lado, cor, mexe) => {
  const a = lado * (22 + mexe);
  return `<g transform="translate(${f1(x + lado * 0.5 * u)} ${f1(y - 0.24 * u)}) rotate(${f1(a)})">
    <ellipse cx="${f1(lado * 0.2 * u)}" cy="0" rx="${f1(0.27 * u)}" ry="${f1(0.105 * u)}" fill="${cor.cara}" stroke="${cor.contorno}" stroke-width="${f1(0.02 * u)}"/>
    <ellipse cx="${f1(lado * 0.24 * u)}" cy="${f1(0.01 * u)}" rx="${f1(0.17 * u)}" ry="${f1(0.05 * u)}" fill="${cor.la}" opacity="0.28"/></g>`;
};

// cara comprida: estreita na testa, larga nos olhos, afina até o focinho arredondado
const cara = (x, y, u, cor) => {
  const P = (dx, dy) => `${f1(x + dx * u)},${f1(y + dy * u)}`;
  return `<path d="M${P(0, -0.47)} C${P(0.24, -0.47)} ${P(0.36, -0.22)} ${P(0.34, -0.02)} C${P(0.32, 0.2)} ${P(0.3, 0.42)} ${P(0.24, 0.6)}
    C${P(0.16, 0.74)} ${P(-0.16, 0.74)} ${P(-0.24, 0.6)} C${P(-0.3, 0.42)} ${P(-0.32, 0.2)} ${P(-0.34, -0.02)} C${P(-0.36, -0.22)} ${P(-0.24, -0.47)} ${P(0, -0.47)} Z"
    fill="${cor.cara}" stroke="${cor.contorno}" stroke-width="${f1(0.022 * u)}"/>`;
};

// focinho amassado na cerca: b = 0..1 (força do empurrão) achata e alarga
const focinho = (x, y, u, b, cor) => {
  const fx = 0.25 * (1 + 0.32 * b), fy = 0.14 * (1 - 0.2 * b), cy = y + 0.5 * u;
  const narina = (l) => `<path d="M${f1(x + l * 0.04 * u)},${f1(cy - 0.035 * u)} q${f1(l * 0.05 * u)},${f1(0.005 * u)} ${f1(l * 0.07 * u)},${f1(0.045 * u)}" fill="none" stroke="${cor.pupila}" stroke-width="${f1(0.024 * u)}" stroke-linecap="round"/>`;
  return `<ellipse cx="${f1(x)}" cy="${f1(cy)}" rx="${f1(fx * u)}" ry="${f1(fy * u)}" fill="${cor.focinho}"/>
    <ellipse cx="${f1(x - 0.06 * u)}" cy="${f1(cy - 0.06 * u)}" rx="${f1(0.08 * u)}" ry="${f1(0.025 * u)}" fill="#ffffff" opacity="${(0.1 + 0.18 * b).toFixed(3)}"/>
    ${narina(-1)}${narina(1)}
    <path d="M${f1(x - 0.08 * u)},${f1(cy + 0.075 * u)} q${f1(0.04 * u)},${f1(0.035 * u)} ${f1(0.08 * u)},0 q${f1(0.04 * u)},${f1(0.035 * u)} ${f1(0.08 * u)},0" fill="none" stroke="${cor.pupila}" stroke-width="${f1(0.016 * u)}" stroke-linecap="round"/>`;
};

// Ovelha completa. empurra = 0..1; pisca em 2 momentos fixos (por T); rot gira o conjunto (pra espiar do canto)
export function ovelha(T, { x, y, u, cor, empurra = 0, rot = 0, comPeito = true }) {
  const pis = (t0) => Math.max(0, 1 - Math.abs(T - t0) / 0.07);
  const pisca = Math.min(1, pis(1.9) + pis(4.6) + pis(7.4) + pis(11.2) + pis(14.1));
  const mexe = Math.sin(T * 5) * 3, ex = 0.17 * u, ey = y - 0.08 * u;
  return `<g transform="rotate(${rot} ${f1(x)} ${f1(y)})">
    ${comPeito ? nuvem(x, y, u, LA_PEITO, cor) : ""}${orelha(x, y, u, -1, cor, mexe)}${orelha(x, y, u, 1, cor, -mexe)}
    ${nuvem(x, y, u, LA_CABECA, cor)}${cara(x, y, u, cor)}${olho(x - ex, ey, u, -1, pisca, cor)}${olho(x + ex, ey, u, 1, pisca, cor)}
    ${focinho(x, y, u, empurra, cor)}${nuvem(x, y, u, TOPETE, cor)}</g>`;
}

// ponto do focinho (centro do bojo da cerca)
export const focinhoEm = (x, y, u) => ({ x, y: y + 0.5 * u });
