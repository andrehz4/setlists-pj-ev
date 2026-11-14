// Layout V: o abacate, desenhado do zero. Inteiro (casca verde-escura com degradê, brilho e pintinhas de lenticela,
// cabinho) e cortado ao meio (borda de casca, polpa em degradê do verde junto à casca ao amarelo no miolo, fibras finas,
// cavidade sombreada e caroço marrom brilhante com rachaduras). Coordenadas locais: caixa ~ 824 x 892, centro (0, 0).
import { novoId, f1, rnd } from "./pecas.mjs";

// Cores da fruta (iguais em todos os temas: abacate é abacate)
export const FRUTA = { casca: "#35561f", casca2: "#14280c", cascaBrilho: "#7a9a3e", polpa: "#f3e78e", polpa2: "#cfdc64", polpa3: "#7fa733",
  caroco: "#8c5426", caroco2: "#3e210c", carocoBrilho: "#e4b47c" };

// lado direito do contorno (3 cúbicas); o esquerdo é espelho
const SEG = [[[0, -450], [95, -452], [160, -380], [190, -290]], [[190, -290], [222, -196], [410, -80], [412, 150]], [[412, 150], [414, 340], [240, 442], [0, 442]]];
const pt = (s, t) => [0, 1].map((k) => (1 - t) ** 3 * s[0][k] + 3 * (1 - t) ** 2 * t * s[1][k] + 3 * (1 - t) * t * t * s[2][k] + t ** 3 * s[3][k]);
const AMOSTRAS = SEG.flatMap((s) => Array.from({ length: 41 }, (_, i) => pt(s, i / 40)));
// meia largura do abacate na altura y (coordenada local)
export const meiaLargura = (y) => Math.max(0, ...AMOSTRAS.filter(([, b]) => Math.abs(b - y) < 12).map(([a]) => a));

const c = (s) => `C${s[1].join(",")} ${s[2].join(",")} ${s[3].join(",")}`;
const esp = (s) => `C${-s[2][0]},${s[2][1]} ${-s[1][0]},${s[1][1]} ${-s[0][0]},${s[0][1]}`;
export const CONTORNO = `M0,-450 ${SEG.map(c).join(" ")} ${[...SEG].reverse().map(esp).join(" ")} Z`;
export const CAROCO = { cx: 0, cy: 232, rx: 158, ry: 168 };

// pintinhas da casca (lenticelas) em posições fixas dentro do contorno
const LENT = Array.from({ length: 90 }, (_, i) => [(rnd(i + 3) * 2 - 1), rnd(i + 41) * 860 - 430, 1.5 + rnd(i + 77) * 3])
  .map(([u, y, r]) => [u * meiaLargura(y) * 0.88, y, r]);

// Abacate inteiro. s = escala, rot = graus, sx = achatamento lateral (variedade)
export function inteiro(cx, cy, s, rot = 0, sx = 1, sombra = true) {
  const g = novoId("va"), b = novoId("vb");
  return `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${f1(rot)}) scale(${f1(s * sx)} ${f1(s)})">
    <radialGradient id="${g}" cx="0.36" cy="0.42" r="0.75"><stop offset="0" stop-color="${FRUTA.cascaBrilho}"/><stop offset="0.35" stop-color="${FRUTA.casca}"/><stop offset="1" stop-color="${FRUTA.casca2}"/></radialGradient>
    <radialGradient id="${b}" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff" stop-opacity="0.38"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    ${sombra ? `<ellipse cx="30" cy="455" rx="380" ry="40" fill="#000" opacity="0.3"/>` : ""}
    <path d="${CONTORNO}" fill="url(#${g})"/>
    <g fill="${FRUTA.cascaBrilho}" opacity="0.5">${LENT.map(([x, y, r]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}"/>`).join("")}</g>
    <ellipse cx="-170" cy="-60" rx="110" ry="190" fill="url(#${b})" transform="rotate(18 -170 -60)"/>
    <path d="${CONTORNO}" fill="none" stroke="${FRUTA.casca2}" stroke-width="5" opacity="0.7"/>
    <path d="M-8,-446 C-10,-478 4,-500 22,-508 L30,-496 C16,-488 10,-472 10,-446 Z" fill="#6b4a22"/></g>`;
}

// fibras finas da polpa, do topo descendo até o caroço
const FIBRAS = Array.from({ length: 9 }, (_, i) => { const u = (i - 4) / 4.6, x0 = u * 120, x1 = u * 300;
  return `M${f1(x0)},-380 C${f1(x0 * 1.4)},-200 ${f1(x1)},-60 ${f1(x1 * 0.92)},${f1(120 + rnd(i) * 60)}`; }).join(" ");

// Metade cortada, com caroço. k (0..1) = brilho úmido do corte aparecendo
export function metade(cx, cy, s, rot = 0, k = 1) {
  const p = novoId("vp"), cv = novoId("vc"), cr = novoId("vr"), br = novoId("vh"), cl = novoId("vl");
  const { cy: ky, rx, ry } = CAROCO;
  const rachas = [`M-60,${ky - 150} C-90,${ky - 60} -80,${ky + 40} -30,${ky + 150}`, `M70,${ky - 160} C110,${ky - 70} 120,${ky + 30} 90,${ky + 130}`, `M-120,${ky + 20} C-100,${ky + 70} -70,${ky + 110} -40,${ky + 140}`];
  return `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${f1(rot)}) scale(${f1(s)})">
    <radialGradient id="${p}" cx="0.5" cy="0.66" r="0.62"><stop offset="0" stop-color="${FRUTA.polpa}"/><stop offset="0.5" stop-color="${FRUTA.polpa}"/><stop offset="0.78" stop-color="${FRUTA.polpa2}"/><stop offset="0.95" stop-color="${FRUTA.polpa3}"/><stop offset="1" stop-color="${FRUTA.casca}"/></radialGradient>
    <radialGradient id="${cv}" cx="0.5" cy="0.5" r="0.5"><stop offset="0.82" stop-color="${FRUTA.polpa3}" stop-opacity="0.75"/><stop offset="1" stop-color="${FRUTA.polpa}" stop-opacity="0"/></radialGradient>
    <radialGradient id="${cr}" cx="0.36" cy="0.3" r="0.8"><stop offset="0" stop-color="${FRUTA.carocoBrilho}"/><stop offset="0.38" stop-color="${FRUTA.caroco}"/><stop offset="1" stop-color="${FRUTA.caroco2}"/></radialGradient>
    <radialGradient id="${br}" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <clipPath id="${cl}"><path d="${CONTORNO}" transform="scale(0.955)"/></clipPath>
    <ellipse cx="30" cy="455" rx="390" ry="42" fill="#000" opacity="0.32"/>
    <path d="${CONTORNO}" fill="${FRUTA.casca2}"/><path d="${CONTORNO}" fill="${FRUTA.casca}" transform="scale(0.975)"/>
    <path d="${CONTORNO}" fill="url(#${p})" transform="scale(0.955)"/>
    <g clip-path="url(#${cl})"><path d="${FIBRAS}" fill="none" stroke="${FRUTA.polpa3}" stroke-width="1.6" opacity="0.22"/>
      <ellipse cx="-150" cy="-120" rx="120" ry="230" fill="url(#${br})" opacity="${f1(0.22 * k)}" transform="rotate(16 -150 -120)"/></g>
    <ellipse cx="0" cy="${ky + 6}" rx="${rx + 34}" ry="${ry + 34}" fill="url(#${cv})"/>
    <ellipse cx="6" cy="${ky + 12}" rx="${rx}" ry="${ry}" fill="${FRUTA.caroco2}" opacity="0.6"/>
    <ellipse cx="0" cy="${ky}" rx="${rx}" ry="${ry}" fill="url(#${cr})"/>
    <path d="${rachas.join(" ")}" fill="none" stroke="${FRUTA.caroco2}" stroke-width="2.2" opacity="0.35"/>
    <ellipse cx="-64" cy="${ky - 92}" rx="54" ry="30" fill="url(#${br})" opacity="0.55" transform="rotate(-30 -64 ${ky - 92})"/>
    <ellipse cx="-80" cy="${ky - 104}" rx="16" ry="9" fill="#fff" opacity="0.75" transform="rotate(-30 -80 ${ky - 104})"/>
    <path d="M${rx - 30},${ky + 70} A${rx},${ry} 0 0 1 40,${ky + ry - 6}" fill="none" stroke="${FRUTA.carocoBrilho}" stroke-width="5" stroke-linecap="round" opacity="0.4"/></g>`;
}

// Monte de abacates deitados (duas fileiras) pra pôr dentro do caixote: base das frutas na altura y
export function monte(cx, y, w, s, sem = 0) {
  const passo = 640 * s, n = Math.max(2, Math.floor((w - 60) / passo)), x0 = cx - ((n - 1) * passo) / 2;
  const fileira = (dy, k, desl) => Array.from({ length: n - (desl ? 1 : 0) }, (_, i) => {
    const r = sem + i * 3 + k * 17, rot = (rnd(r) < 0.5 ? -1 : 1) * (70 + rnd(r + 1) * 40);
    return inteiro(x0 + i * passo + (desl ? passo / 2 : 0) + (rnd(r + 2) - 0.5) * 20, y + dy + (rnd(r + 3) - 0.5) * 14, s * (0.92 + rnd(r + 4) * 0.12), rot, 0.84, false);
  }).join("");
  return fileira(-240 * s, 1, true) + fileira(-90 * s, 0, false);
}
