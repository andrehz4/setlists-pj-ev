// Layout V (homenagem ao clima do álbum de 2006, o do abacate, numa feira livre brasileira; sem foto, sem logotipo e
// sem o nome do disco): peças comuns. Textos com largura medida, grão, fundo da barraca, tábuas de madeira com veio e
// prego, e o caixote de feira. Tudo função pura, rotação "aleatória" vem de rnd(semente).
import { esc, F_ANTON } from "../../pecas.mjs";
import { largura, cabe } from "./medida.mjs";

export { esc, largura, cabe };
export const F_MAO = "'Permanent Marker','Anton',cursive";
export const F_SANS = "'Inter',system-ui,sans-serif";
export const rnd = (s) => { const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
let _id = 0;
export const novoId = (pre) => `${pre}${++_id}`;
export const f1 = (v) => (Math.round(v * 10) / 10).toString();

// Texto: fonte "mao" (pincel atômico), "anton" (letreiro pintado) ou "sans" (Inter Bold, apoio)
export function texto(x, y, t, f, fill, { fonte = "mao", anchor = "middle", ls = 0, op = 1, rot = 0 } = {}) {
  const fam = fonte === "anton" ? F_ANTON : fonte === "sans" ? F_SANS : F_MAO, w = fonte === "sans" ? 700 : 400;
  const r = rot ? ` transform="rotate(${f1(rot)} ${f1(x)} ${f1(y)})"` : "";
  return `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-family="${fam}" font-weight="${w}" font-size="${f1(f)}" letter-spacing="${ls}" fill="${fill}" opacity="${op}"${r}>${esc(t)}</text>`;
}

// grão: ladrilho de 200 px com pontinhos fixos (custo quase zero por quadro)
const PONTOS = Array.from({ length: 240 }, (_, i) => `<circle cx="${f1(rnd(i) * 200)}" cy="${f1(rnd(i + 300) * 200)}" r="${f1(0.5 + rnd(i + 700) * 1.1)}"/>`).join("");
export function grao(corGrao, op, x = 0, y = 0, w = 1080, h = 1920) {
  const id = novoId("vg");
  return `<pattern id="${id}" width="200" height="200" patternUnits="userSpaceOnUse"><g fill="${corGrao}">${PONTOS}</g></pattern><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id})" opacity="${op}"/>`;
}

// Fundo da barraca: degradê vertical da cor do tema, vinheta e grão
export function fundo(cor) {
  const g = novoId("vf"), v = novoId("vv");
  return `<linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cor.bg2}"/><stop offset="0.45" stop-color="${cor.bg}"/><stop offset="1" stop-color="${cor.bg2}"/></linearGradient>
    <radialGradient id="${v}" cx="0.5" cy="0.45" r="0.8"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.35"/></radialGradient>
    <rect width="1080" height="1920" fill="url(#${g})"/><rect width="1080" height="1920" fill="url(#${v})"/>${grao(cor.graoCor, 0.08)}`;
}

// Tábuas horizontais (n tábuas em x, y, w, h): degradê por tábua, veios ondulados, nó, frestas e pregos nas pontas
export function tabuas(x, y, w, h, n, cor, sem = 0, { pregos = true, op = 1 } = {}) {
  const th = h / n, g = novoId("vt");
  let s = `<linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cor.mad}"/><stop offset="0.75" stop-color="${cor.mad}"/><stop offset="1" stop-color="${cor.mad2}"/></linearGradient><g opacity="${op}">`;
  for (let i = 0; i < n; i++) {
    const ty = y + i * th, tom = rnd(sem + i * 7) * 0.22;
    s += `<rect x="${f1(x)}" y="${f1(ty)}" width="${f1(w)}" height="${f1(th - 4)}" rx="3" fill="url(#${g})"/>
      <rect x="${f1(x)}" y="${f1(ty)}" width="${f1(w)}" height="${f1(th - 4)}" rx="3" fill="${cor.mad2}" opacity="${tom.toFixed(3)}"/>`;
    for (let v = 0; v < 4; v++) { // veios: senoides longas e finas
      const vy = ty + th * (0.2 + v * 0.18 + rnd(sem + i * 13 + v) * 0.06), a = 2 + rnd(sem + i + v * 3) * 4, fase = rnd(sem + v + i * 5) * 600;
      let d = `M${f1(x + 6)},${f1(vy)}`;
      for (let q = 1; q <= 12; q++) d += ` Q${f1(x + w * (q - 0.5) / 12)},${f1(vy + a * Math.sin((q * 90 + fase) / 57))} ${f1(x + (w * q) / 12 - 6)},${f1(vy)}`;
      s += `<path d="${d}" fill="none" stroke="${cor.veio}" stroke-width="${f1(0.8 + rnd(v + i) * 0.9)}" opacity="0.45"/>`;
    }
    const nx = x + w * (0.2 + rnd(sem + i * 3) * 0.6), ny = ty + th * 0.45;
    s += `<ellipse cx="${f1(nx)}" cy="${f1(ny)}" rx="16" ry="5" fill="none" stroke="${cor.veio}" stroke-width="1.4" opacity="0.6"/><ellipse cx="${f1(nx)}" cy="${f1(ny)}" rx="6" ry="2" fill="${cor.veio}" opacity="0.6"/>
      <rect x="${f1(x)}" y="${f1(ty)}" width="${f1(w)}" height="2" fill="#fff" opacity="0.12"/>`;
    if (pregos) for (const px of [x + 22, x + w - 22]) s += `<circle cx="${f1(px)}" cy="${f1(ty + th / 2 - 2)}" r="5" fill="#3a3a38"/><circle cx="${f1(px - 1.5)}" cy="${f1(ty + th / 2 - 3.5)}" r="1.8" fill="#bdbdb6"/>`;
  }
  return s + "</g>";
}

// Caixote de feira visto de frente: 2 ripas largas com fresta (fundo escuro aparece), cantoneiras e borda de cima.
// `dentro` = o que vai dentro (frutas), desenhado atrás das ripas.
export function caixote(cx, y, w, h, cor, sem = 0, dentro = "") {
  const x = cx - w / 2, r = h * 0.42, gap = h * 0.08;
  const sombra = `<ellipse cx="${f1(cx)}" cy="${f1(y + h + 8)}" rx="${f1(w * 0.55)}" ry="18" fill="#000" opacity="0.35"/>`;
  return `${sombra}<rect x="${f1(x + 8)}" y="${f1(y - h * 0.12)}" width="${f1(w - 16)}" height="${f1(h * 0.5)}" fill="#1a120a" opacity="0.85"/>${dentro}
    <rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="#120c06" opacity="0.9"/>
    ${tabuas(x + 14, y, w - 28, r, 1, cor, sem, { pregos: false })}${tabuas(x + 14, y + r + gap, w - 28, r, 1, cor, sem + 5, { pregos: false })}
    ${[x, x + w - 26].map((px) => `<rect x="${f1(px)}" y="${f1(y - 8)}" width="26" height="${f1(h + 8)}" rx="2" fill="${cor.mad2}"/><rect x="${f1(px + 3)}" y="${f1(y - 8)}" width="5" height="${f1(h + 8)}" fill="#fff" opacity="0.12"/>
      <circle cx="${f1(px + 13)}" cy="${f1(y + r / 2)}" r="4.5" fill="#2e2e2c"/><circle cx="${f1(px + 13)}" cy="${f1(y + r + gap + r / 2)}" r="4.5" fill="#2e2e2c"/>`).join("")}`;
}
