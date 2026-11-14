// Layout V: objetos da feira. Toldo listrado com babado de meia-lua, papel de embrulho amassado, plaquinha de preço
// (cartolina com pincel atômico) espetada num palito, etiqueta de preço com barbante (pino do mapa), lâmpada pendurada
// e etiqueta adesiva de fruta. Rotação e amassado vêm de rnd(semente): mesmo quadro, mesmo desenho.
import { novoId, f1, rnd, grao } from "./pecas.mjs";

// Toldo visto de frente, do topo até `y` (onde começa o babado). k (0..1) desenrola de cima pra baixo.
export function toldo(y, cor, k = 1, { listra = 90 } = {}) {
  const yy = y * k, n = Math.ceil(1080 / listra) + 1, sombra = novoId("vts"), g = novoId("vtg");
  if (yy <= 0) return "";
  let faixas = "", babado = "";
  for (let i = 0; i < n; i++) {
    const x = i * listra - 20, c = i % 2 ? cor.toldoB : cor.toldoA;
    faixas += `<rect x="${x}" y="0" width="${listra}" height="${f1(yy)}" fill="${c}"/>`;
    babado += `<path d="M${x},${f1(yy - 1)} h${listra} v14 a${listra / 2},${listra * 0.42} 0 0 1 ${-listra},0 Z" fill="${c}"/>`;
  }
  // dobras: faixas verticais claras/escuras suaves, sombra perto do topo e embaixo do babado
  const dobras = Array.from({ length: 12 }, (_, i) => `<rect x="${f1(i * 92 + rnd(i) * 30)}" y="0" width="${f1(14 + rnd(i + 9) * 20)}" height="${f1(yy)}" fill="${i % 2 ? "#fff" : "#000"}" opacity="0.06"/>`).join("");
  return `<linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.38"/><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="0.92" stop-color="#fff" stop-opacity="0.08"/><stop offset="1" stop-color="#000" stop-opacity="0.15"/></linearGradient>
    <linearGradient id="${sombra}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <rect x="0" y="${f1(yy)}" width="1080" height="90" fill="url(#${sombra})"/>${faixas}${babado}${dobras}
    <rect x="0" y="0" width="1080" height="${f1(yy + 14)}" fill="url(#${g})"/>${grao("#000", 0.06, 0, 0, 1080, yy + 50)}
    <path d="M0,${f1(yy + 13)} H1080" stroke="#000" stroke-width="1.5" opacity="0.18"/>`;
}

// Papel de embrulho (kraft) com borda irregular, vincos de dobra e grão. Devolve o desenho centrado em (cx, cy).
export function papel(cx, cy, w, h, cor, sem = 0, rot = 0) {
  const x = -w / 2, y = -h / 2, pts = [];
  for (let i = 0; i <= 10; i++) pts.push([x + (w * i) / 10, y + (rnd(sem + i) - 0.5) * 14]);
  for (let i = 0; i <= 14; i++) pts.push([x + w + (rnd(sem + 20 + i) - 0.5) * 12, y + (h * i) / 14]);
  for (let i = 10; i >= 0; i--) pts.push([x + (w * i) / 10, y + h + (rnd(sem + 40 + i) - 0.5) * 14]);
  for (let i = 14; i >= 0; i--) pts.push([x + (rnd(sem + 60 + i) - 0.5) * 12, y + (h * i) / 14]);
  const d = `M${pts.map(([a, b]) => `${f1(a)},${f1(b)}`).join("L")}Z`, g = novoId("vk"), cl = novoId("vkc");
  const vincos = [[0.33, 0], [0.66, 0], [0, 0.5]].map(([a, b], i) => a
    ? `<path d="M${f1(x + a * w)},${y} L${f1(x + a * w + (rnd(sem + i) - 0.5) * 30)},${y + h}" stroke="#000" stroke-width="2.5" opacity="0.1"/><path d="M${f1(x + a * w + 3)},${y} L${f1(x + a * w + 3 + (rnd(sem + i) - 0.5) * 30)},${y + h}" stroke="#fff" stroke-width="2" opacity="0.18"/>`
    : `<path d="M${x},${f1(y + b * h)} L${x + w},${f1(y + b * h + 18)}" stroke="#000" stroke-width="2.5" opacity="0.1"/><path d="M${x},${f1(y + b * h + 3)} L${x + w},${f1(y + b * h + 21)}" stroke="#fff" stroke-width="2" opacity="0.18"/>`).join("");
  return `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${f1(rot)})">
    <radialGradient id="${g}" cx="0.45" cy="0.4" r="0.8"><stop offset="0.4" stop-color="${cor.papel}"/><stop offset="1" stop-color="${cor.papel2}"/></radialGradient>
    <path d="${d}" fill="#000" opacity="0.35" transform="translate(10 14)"/><path d="${d}" fill="url(#${g})"/>
    <clipPath id="${cl}"><path d="${d}"/></clipPath><g clip-path="url(#${cl})">${vincos}${grao(cor.papel2, 0.5, x, y, w, h)}</g></g>`;
}

// Plaquinha de preço: cartolina com canto gasto, palito de espeto saindo de baixo (entra no caixote). `miolo` em
// coordenadas locais (0,0 = canto de cima à esquerda da placa).
export function plaquinha(x, y, w, h, cor, rot, miolo, { palito = 120 } = {}) {
  const g = novoId("vq");
  return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)} ${f1(w / 2)} ${f1(h)})">
    <linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.18"/><stop offset="1" stop-color="#000" stop-opacity="0.12"/></linearGradient>
    ${palito ? `<rect x="${f1(w / 2 - 7)}" y="${f1(h - 30)}" width="14" height="${palito + 30}" rx="5" fill="${cor.mad}"/><rect x="${f1(w / 2 - 7)}" y="${f1(h - 30)}" width="5" height="${palito + 30}" fill="#fff" opacity="0.2"/>` : ""}
    <path d="M6,8 H${w + 8} V${h + 10} H6 Z" fill="#000" opacity="0.3"/>
    <path d="M0,0 H${w} V${h - 18} L${w - 22},${h} H0 Z" fill="${cor.placa}"/><path d="M0,0 H${w} V${h - 18} L${w - 22},${h} H0 Z" fill="url(#${g})"/>
    <path d="M${w},${h - 18} L${w - 22},${h} L${w - 18},${h - 15} Z" fill="#000" opacity="0.18"/>
    ${palito ? `<circle cx="${f1(w / 2)}" cy="${f1(h - 24)}" r="5" fill="${cor.mad2}"/>` : ""}${miolo}</g>`;
}

// Etiqueta de preço com furo e barbante (pino do mapa): ponta do barbante em (x, y), etiqueta pendurada embaixo.
export function etiquetaPreco(x, y, txt, cor, s = 1, rot = 0, fonte = "") {
  return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)}) scale(${f1(s)})">
    <circle r="7" fill="${cor.acento}" stroke="#fff" stroke-width="2"/><path d="M0,0 C-10,14 6,22 0,34" fill="none" stroke="${cor.barbante}" stroke-width="2.2"/>
    <path d="M-30,44 L0,30 L30,44 V104 H-30 Z" fill="#000" opacity="0.3" transform="translate(4 5)"/>
    <path d="M-30,44 L0,30 L30,44 V104 H-30 Z" fill="${cor.etiq}" stroke="${cor.acento}" stroke-width="2.5"/><circle cy="44" r="4.5" fill="${cor.papel2}"/>
    ${fonte}</g>`;
}

// Lâmpada de barraca no fio. Com cor.luz > 0 (tema noite) acende o halo.
export function lampada(x, y, cor, k = 1) {
  const h = novoId("vlh"), b = novoId("vlb");
  return `<radialGradient id="${h}" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${cor.luzCor}" stop-opacity="0.55"/><stop offset="0.35" stop-color="${cor.luzCor}" stop-opacity="0.16"/><stop offset="1" stop-color="${cor.luzCor}" stop-opacity="0"/></radialGradient>
    <radialGradient id="${b}" cx="0.45" cy="0.4" r="0.6"><stop offset="0" stop-color="#fffbe8"/><stop offset="1" stop-color="${cor.luz ? "#ffcf6a" : "#e9e4d4"}"/></radialGradient>
    ${cor.luz ? `<circle cx="${x}" cy="${y + 60}" r="620" fill="url(#${h})" opacity="${f1(cor.luz * k)}"/>` : ""}
    <path d="M${x},-10 V${y}" stroke="#111" stroke-width="3"/><rect x="${x - 14}" y="${y}" width="28" height="34" rx="4" fill="#2a2a28"/>
    <path d="M${x - 13},${y + 34} C${x - 40},${y + 60} ${x - 34},${y + 104} ${x},${y + 110} C${x + 34},${y + 104} ${x + 40},${y + 60} ${x + 13},${y + 34} Z" fill="url(#${b})"/>
    <path d="M${x - 6},${y + 44} q6,22 0,40 M${x + 6},${y + 44} q-6,22 0,40" fill="none" stroke="#b8862a" stroke-width="1.6" opacity="0.8"/>`;
}
