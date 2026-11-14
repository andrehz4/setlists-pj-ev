// Layout R: as "fotos" do mural são DESENHOS genéricos (nada de foto real): olho, dado, chave, óculos, estrada e lua,
// em silhueta e traço fino, nas cores desbotadas do filme (paleta cor.filme). Cada um desenha num quadrado 100 x 100
// (escalado pro lado s da imagem) e já traz fundo próprio. O acabamento de filme vem depois, na polaroide.
import { novoId, f1, rnd, sombra } from "./pecas.mjs";

const caixa = (x, y, s, miolo) => `<g transform="translate(${f1(x)} ${f1(y)}) scale(${(s / 100).toFixed(4)})">${miolo}</g>`;
const degrade = (c1, c2, vertical = true) => { const id = novoId("rd");
  return { id, def: `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>` }; };
const fundo = (c1, c2) => { const g = degrade(c1, c2); return `${g.def}<rect width="100" height="100" fill="url(#${g.id})"/>`; };

// Olho em close: amêndoa, íris com raios finos, pupila, brilho, pálpebra com sombra, cílios e sobrancelha
function olho(pal) {
  const amendoa = "M8,52 C26,26 74,24 92,50 C74,72 28,76 8,52 Z", cl = novoId("ro"), ir = novoId("ri"), pl = degrade(pal.sombra, pal.pele);
  const raios = Array.from({ length: 30 }, (_, i) => { const a = (i / 30) * Math.PI * 2, r0 = 6.5, r1 = 15 + rnd(i) * 2;
    return `M${f1(50 + r0 * Math.cos(a))},${f1(50 + r0 * Math.sin(a))} L${f1(50 + r1 * Math.cos(a))},${f1(50 + r1 * Math.sin(a))}`; }).join("");
  // cílios: saem da borda de cima (curva de Bézier da amêndoa), na direção da normal, inclinados pro canto de fora
  const bz = (t, a, b, c, d) => (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * d;
  const cilios = Array.from({ length: 9 }, (_, i) => { const t = 0.2 + i * 0.075, x = bz(t, 8, 26, 74, 92), y = bz(t, 52, 26, 24, 50);
    const lado = (t - 0.5) * 2, c = 3.5 + 2.5 * Math.sin(Math.PI * t);
    return `M${f1(x)},${f1(y)} q${f1(lado * 1.5)},${f1(-c * 0.7)} ${f1(lado * 3.2 + 0.6)},${f1(-c)}`; }).join("");
  const sobrancelha = Array.from({ length: 22 }, (_, i) => { const t = i / 21, x = 18 + 66 * t, y = 17 - 6 * Math.sin(Math.PI * t * 0.9) + rnd(i + 3) * 0.8;
    return `M${f1(x)},${f1(y + 1.6)} l${f1(2.6)},-${f1(1.4 + rnd(i) * 0.8)}`; }).join("");
  return `${fundo(pal.pele, pal.meio)}${pl.def}<radialGradient id="${ir}"><stop offset="0.3" stop-color="${pal.meio}"/><stop offset="1" stop-color="${pal.sombra}"/></radialGradient>
    <path d="M4,50 C24,14 76,12 96,48" fill="none" stroke="${pal.sombra}" stroke-width="0.7" opacity="0.45"/>
    <clipPath id="${cl}"><path d="${amendoa}"/></clipPath><path d="${amendoa}" fill="${pal.luz}"/>
    <g clip-path="url(#${cl})"><circle cx="50" cy="50" r="17" fill="url(#${ir})"/><path d="${raios}" stroke="${pal.luz}" stroke-width="0.35" opacity="0.4"/>
      <circle cx="50" cy="50" r="6.8" fill="${pal.sombra}"/><circle cx="50" cy="50" r="17" fill="none" stroke="${pal.sombra}" stroke-width="1.1"/>
      <rect x="0" y="22" width="100" height="16" fill="url(#${pl.id})" opacity="0.5"/></g>
    <circle cx="44.5" cy="44" r="2.8" fill="#fff" opacity="0.85"/><circle cx="56" cy="55" r="1.1" fill="#fff" opacity="0.5"/>
    <path d="${amendoa}" fill="none" stroke="${pal.sombra}" stroke-width="0.9"/>
    <path d="${cilios}" fill="none" stroke="${pal.sombra}" stroke-width="0.5" stroke-linecap="round"/>
    <path d="M17,19 C34,8 62,6 85,15 C62,10 36,12 17,19 Z" fill="${pal.sombra}" opacity="0.35"/>
    <path d="${sobrancelha}" stroke="${pal.sombra}" stroke-width="0.35" stroke-linecap="round" opacity="0.6"/>`;
}

// Dado em perspectiva sobre a mesa: 3 faces com tons diferentes, pontos projetados em cada face, sombra no tampo
function dado(pal) {
  const face = (o, u, v, cor, pts) => `<polygon points="${o} ${o[0] + u[0]},${o[1] + u[1]} ${o[0] + u[0] + v[0]},${o[1] + u[1] + v[1]} ${o[0] + v[0]},${o[1] + v[1]}" fill="${cor}" stroke="${pal.sombra}" stroke-width="0.5" stroke-linejoin="round"/>
    <g transform="matrix(${u[0]} ${u[1]} ${v[0]} ${v[1]} ${o[0]} ${o[1]})" fill="${pal.sombra}">${pts.map(([a, b]) => `<circle cx="${a}" cy="${b}" r="0.085"/>`).join("")}</g>`;
  const s = sombra(2.2);
  return `${fundo(pal.ceu, pal.ceu2)}<rect y="64" width="100" height="36" fill="${pal.meio}" opacity="0.35"/><path d="M0,64 H100" stroke="${pal.sombra}" stroke-width="0.4" opacity="0.4"/>
    ${s.def}<ellipse cx="58" cy="80" rx="30" ry="6" fill="${pal.sombra}" opacity="0.45" filter="url(#${s.id})"/>
    ${face([26, 36], [24, 12], [0, 30], pal.luz, [[0.25, 0.25], [0.75, 0.75]])}
    ${face([50, 48], [24, -12], [0, 30], pal.meio, [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]])}
    ${face([26, 36], [24, -12], [24, 12], "#fff", [[0.5, 0.5]])}
    <path d="M27,37 L50,25" stroke="#fff" stroke-width="0.6" opacity="0.6"/>`;
}

// Chave antiga em silhueta, deitada na diagonal, com sombra deslocada e reflexo fino na haste
function chave(pal) {
  const forma = `M20,50 a13,13 0 1 0 26,0 a13,13 0 1 0 -26,0 Z M26,50 a7,7 0 1 1 14,0 a7,7 0 1 1 -14,0 Z
    M46,47.5 H86 V52.5 H82 V60 H77 V56 H73 V61 H68 V52.5 H46 Z`;
  const s = sombra(1.6);
  return `${fundo(pal.ceu, pal.ceu2)}${s.def}<g transform="rotate(-28 52 52)">
    <path d="${forma}" fill="${pal.sombra}" fill-rule="evenodd" opacity="0.4" transform="translate(3 4)" filter="url(#${s.id})"/>
    <path d="${forma}" fill="${pal.sombra}" fill-rule="evenodd"/>
    <circle cx="33" cy="50" r="10" fill="none" stroke="${pal.luz}" stroke-width="0.4" opacity="0.35"/>
    <path d="M47,48.6 H85" stroke="${pal.luz}" stroke-width="0.5" opacity="0.5"/><rect x="44" y="45.5" width="3" height="9" rx="1" fill="${pal.sombra}"/></g>`;
}

// Óculos redondos sobre a mesa de madeira: aro fino, ponte, hastes, reflexo nas lentes e sombra
function oculos(pal) {
  const veios = Array.from({ length: 14 }, (_, i) => `M0,${f1(8 + i * 7 + rnd(i) * 2)} C30,${f1(6 + i * 7)} 60,${f1(11 + i * 7)} 100,${f1(7 + i * 7)}`).join("");
  const lente = (cx) => `<circle cx="${cx}" cy="50" r="15" fill="${pal.luz}" opacity="0.22"/><path d="M${cx - 9},${44} A11,11 0 0 1 ${cx + 2},${38}" fill="none" stroke="#fff" stroke-width="1.1" opacity="0.6"/>
    <circle cx="${cx}" cy="50" r="15" fill="none" stroke="${pal.sombra}" stroke-width="1.6"/>`;
  const s = sombra(1.8);
  return `${fundo(pal.quente, pal.meio)}<path d="${veios}" fill="none" stroke="${pal.sombra}" stroke-width="0.35" opacity="0.28"/>${s.def}
    <g opacity="0.4" filter="url(#${s.id})" transform="translate(3 6)"><circle cx="32" cy="50" r="15" fill="none" stroke="${pal.sombra}" stroke-width="2"/><circle cx="68" cy="50" r="15" fill="none" stroke="${pal.sombra}" stroke-width="2"/></g>
    <path d="M17,47 L6,40 L4,44 M83,47 L94,40 L96,44" fill="none" stroke="${pal.sombra}" stroke-width="1.3" stroke-linecap="round"/>
    ${lente(32)}${lente(68)}<path d="M46,47 Q50,42 54,47" fill="none" stroke="${pal.sombra}" stroke-width="1.5"/>`;
}

// Estrada reta até o horizonte: céu quente embaixo, morros, faixa central encolhendo e postes com fio
function estrada(pal) {
  const faixas = Array.from({ length: 7 }, (_, i) => { const a = Math.pow(i / 7, 2), b = Math.pow((i + 0.5) / 7, 2);
    return `<polygon points="${f1(50 - 0.2 - a * 1.6)},${f1(55 + a * 45)} ${f1(50 + 0.2 + a * 1.6)},${f1(55 + a * 45)} ${f1(50 + 0.2 + b * 1.6)},${f1(55 + b * 45)} ${f1(50 - 0.2 - b * 1.6)},${f1(55 + b * 45)}"/>`; }).join("");
  // postes ficam mais altos quanto mais perto (perspectiva); o fio cai em curva entre os topos
  const topos = [0.12, 0.3, 0.6, 1].map((k) => { const x = 54 + k * 40, y = 55 + k * 30; return [x, y, y - 4 - k * 44, k]; });
  const postes = topos.map(([x, y, t, k]) => `M${f1(x)},${f1(y)} V${f1(t)} M${f1(x - 1 - k * 4)},${f1(t + 1 + k * 2)} h${f1(2 + k * 8)}`).join("");
  const fios = topos.slice(1).map(([x, , t], i) => { const [a, , b] = topos[i]; return `M${f1(a)},${f1(b + 0.6)} Q${f1((a + x) / 2)},${f1((b + t) / 2 + 2.5)} ${f1(x)},${f1(t + 0.6)}`; }).join("");
  const c = degrade(pal.ceu, pal.quente);
  return `${c.def}<rect width="100" height="56" fill="url(#${c.id})"/><circle cx="34" cy="52" r="7" fill="${pal.luz}" opacity="0.5"/>
    <path d="M0,56 C14,48 26,51 38,54 C50,50 62,47 76,52 C86,49 94,50 100,53 V58 H0 Z" fill="${pal.meio}" opacity="0.8"/>
    <rect y="55" width="100" height="45" fill="${pal.meio}"/><polygon points="49.4,55 50.6,55 92,100 8,100" fill="${pal.sombra}"/>
    <path d="M49.4,55 L8,100 M50.6,55 L92,100" stroke="${pal.luz}" stroke-width="0.4" opacity="0.5"/><g fill="${pal.luz}" opacity="0.8">${faixas}</g>
    <path d="${postes}" stroke="${pal.sombra}" stroke-width="0.6" fill="none"/><path d="${fios}" stroke="${pal.sombra}" stroke-width="0.25" fill="none" opacity="0.8"/>`;
}

// Lua cheia com crateras, halo e estrelas sobre o morro escuro com árvores
function lua(pal) {
  const h = novoId("rh"), est = Array.from({ length: 34 }, (_, i) => `<circle cx="${f1(rnd(i + 5) * 100)}" cy="${f1(rnd(i + 55) * 62)}" r="${f1(0.25 + rnd(i + 95) * 0.5)}"/>`).join("");
  const crat = [[56, 34, 4], [66, 44, 3], [60, 48, 2], [52, 42, 2.4], [68, 32, 1.8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${pal.meio}" opacity="0.28"/>`).join("");
  const arvores = Array.from({ length: 9 }, (_, i) => { const x = 4 + i * 11 + rnd(i) * 4, y = 80 - 6 * Math.sin(i / 2.6), t = 6 + rnd(i + 9) * 6;
    return `M${f1(x)},${f1(y - t)} L${f1(x + 2.6)},${f1(y)} L${f1(x - 2.6)},${f1(y)} Z`; }).join("");
  return `${fundo(pal.sombra, pal.meio)}<g fill="${pal.luz}" opacity="0.75">${est}</g>
    <radialGradient id="${h}"><stop offset="0.45" stop-color="${pal.luz}" stop-opacity="0.45"/><stop offset="1" stop-color="${pal.luz}" stop-opacity="0"/></radialGradient>
    <circle cx="60" cy="40" r="32" fill="url(#${h})"/><circle cx="60" cy="40" r="17" fill="${pal.luz}"/>${crat}
    <path d="M0,84 C20,74 40,78 60,82 C76,76 90,78 100,74 V100 H0 Z" fill="${pal.sombra}"/><path d="${arvores}" fill="${pal.sombra}"/>`;
}

export const DESENHOS = { olho, dado, chave, oculos, estrada, lua };
export const NOMES = Object.keys(DESENHOS);
// desenho pronto pra polaroide: foto(x, y, s)
export const desenho = (nome, pal) => (x, y, s) => caixa(x, y, s, DESENHOS[nome](pal));
