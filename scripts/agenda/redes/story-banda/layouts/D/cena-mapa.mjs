// Layout D, cena 3 (5.5 a 9) e a transição pra 4: cabeçalho "ONDE" + estado, janela do mapa com os estados dos shows
// em bloco chapado subindo de baixo, mira de 3 px por cidade, marcador quadrado e etiqueta com a coordenada. Em 9.0
// a janela encolhe pra faixa de cima (MAP4) e fica como mapa pequeno atrás da lista de shows (até 12.5).
import { lerp } from "../../tempo.mjs";
import { mask, filete, pr, out, io, lin, texto, novoId, f1 } from "./pecas.mjs";
import { MAP3, LH, contornos, mistura, transforma, tela } from "./mapa-modelo.mjs";

const mixR = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });
const ret = (x, y, w, h, fill, extra = "") =>
  `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(Math.max(0, w))}" height="${f1(Math.max(0, h))}" fill="${fill}"${extra}/>`;
const recorte = (id, R) => `<clipPath id="${id}">${ret(R.x, R.y, R.w, R.h, "#000")}</clipPath>`;

// etiqueta da cidade: revela por largura a partir do lado do marcador, com o fio do marcador até ela
function etiqueta(T, c, a, cor, nx, q) {
  const rv = pr(T, c.t + 0.1, 0.35, io);
  if (rv <= 0) return "";
  const { bx, lw, ly } = c, ex = c.right ? bx : bx + lw, id = novoId("de");
  const cx = c.right ? bx - 4 : bx + lw * (1 - rv) - 4;
  const x1 = a[0] + (c.right ? 24 : -24), x2 = lerp(a[0], ex, rv), y2 = lerp(a[1], ly + LH / 2, rv);
  const fio = `<line x1="${f1(x1)}" y1="${f1(a[1])}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${cor.ink}" stroke-width="3"/>`;
  const num = nx ? ret(bx, ly, nx, LH, cor.ink) + texto(bx + 30, ly + 70, String(c.n), 44, cor.bg, "ab", "middle") : "";
  const caixa = ret(bx, ly, lw, LH, cor.bg, ` stroke="${cor.ink}" stroke-width="3"`);
  const tx = bx + nx + 22;
  const txt = texto(tx, ly + 50, c.cidade, c.fc, cor.ink, "xb") + texto(tx, ly + 88, c.coord, c.fk, cor.ink, "sb");
  return `<g opacity="${(1 - q).toFixed(3)}">${fio}${recorte(id, { x: cx, y: ly - 4, w: lw * rv + 8, h: LH + 8 })}
    <g clip-path="url(#${id})">${caixa}${num}${txt}</g></g>`;
}

// marcador: quadrado 44 com borda 5 e miolo 16
const marcador = (a, k, cor) => `<g transform="translate(${f1(a[0])} ${f1(a[1])}) scale(${k.toFixed(3)})">
  <rect x="-22" y="-22" width="44" height="44" fill="${cor.bg}" stroke="${cor.ink}" stroke-width="5"/>
  <rect x="-8" y="-8" width="16" height="16" fill="${cor.ink}"/></g>`;

export function cenaMapa(T, story, cor, M) {
  if (T < 5.5 || T >= 12.5) return "";
  const G = M.mapa, p4 = pr(T, 9.0, 0.45, io), q3 = pr(T, 9.0, 0.2, io);
  const c3 = { ...G.cam3, s: G.cam3.s * (1 + 0.04 * pr(T, 5.5, 3.5, lin)) };
  const cam = mistura(c3, G.cam4, p4), tr = transforma(cam), R = mixR(MAP3, G.map4, p4), d = contornos();
  const fillP = pr(T, 5.5, 0.45, io), outl = pr(T, 5.55, 0.3, out);
  const id = novoId("dr"), cab = q3 < 1
    ? mask("ONDE", { y: 280, F: 28, fonte: "xb", fill: cor.ink, p: pr(T, 5.5, 0.4), q: q3 }) +
      mask(G.titulo, { y: 410, F: G.fTitulo, fill: cor.ink, p: pr(T, 5.5, 0.35), q: q3 }) : "";
  const demais = Object.keys(d).filter((u) => !G.lista.includes(u)).map((u) => `<path d="${d[u]}"/>`).join("");
  const meus = G.lista.map((u) => `<path d="${d[u]}"/>`).join("");
  const sobe = recorte(`${id}w`, { x: R.x, y: R.y + R.h * (1 - fillP), w: R.w, h: R.h * fillP });
  // mira: horizontal cresce da esquerda, vertical de cima; de novo em `on` recortada pelos estados dos shows
  const miras = G.pts.map((c) => {
    const a = tela(cam, c.m), hx = pr(T, c.t, 0.35, io), vy = pr(T, c.t + 0.05, 0.35, io);
    if (hx <= 0) return "";
    const l = (col) => ret(R.x, a[1] - 1.5, R.w * hx, 3, col) + ret(a[0] - 1.5, R.y, 3, R.h * vy, col);
    return l(cor.ink) + `<g clip-path="url(#${id}s)">${l(cor.on)}</g>`;
  }).join("");
  const marcas = G.pts.map((c) => {
    const k = pr(T, c.t + 0.3, 0.3) * lerp(1, 0.7, p4);
    return k > 0 ? marcador(tela(cam, c.m), k, cor) : "";
  }).join("");
  const etqs = q3 < 1 ? G.pts.map((c) => etiqueta(T, c, tela(cam, c.m), cor, G.nx, q3)).join("") : "";
  const contorno = `<g transform="${tr}" opacity="${outl.toFixed(3)}" fill="none" stroke="${cor.ink}" stroke-opacity="0.55"
    stroke-width="${(2 / cam.s).toFixed(4)}" stroke-linejoin="round">${demais}</g>`;
  const blocos = `<g clip-path="url(#${id}w)"><g transform="${tr}" fill="${cor.blk}">${meus}</g></g>`;
  const regua = filete(450, pr(T, 5.5, 0.4, io), cor.ink);
  return `<rect width="1080" height="1920" fill="${cor.bg}"/>${cab}${regua}${recorte(`${id}r`, R)}
    <clipPath id="${id}s">${G.lista.map((u) => `<path transform="${tr}" d="${d[u]}"/>`).join("")}</clipPath>${sobe}
    <g clip-path="url(#${id}r)">${contorno}${blocos}${miras}</g>${marcas}${etqs}`;
}
