// Layout T, cenas 1 (a nebulosa se forma por cima do clipe e o nome da banda aparece como uma constelação nova, 0 a 3;
// fecha com o céu abrindo em círculo, como a íris do telescópio) e 2 (logo no visor circular com retícula, 3 a 5.5).
import { p, pop, enter, lerp } from "../../tempo.mjs";
import { linhasDoNome } from "../G/placas.mjs";
import { ceu, nebulosa, estrelas, estrela, txt, cabecalho, coordenada, novoId, f1, rnd, semente } from "./ceu.mjs";
import { cabe } from "./medida.mjs";

const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const dataLonga = (dia) => `${DIAS[new Date(`${dia}T12:00:00Z`).getUTCDay()]}, ${Number(dia.slice(8))} de ${MESES[Number(dia.slice(5, 7)) - 1]}`;
const GREGAS = ["α", "β", "γ", "δ", "ε", "ζ", "η"];

// constelação da banda: 7 estrelas numa faixa, posição tirada do nome (cada banda ganha o seu desenho)
function constelacao(T, story, cor, y0) {
  const s = semente(story.banda), pts = Array.from({ length: 7 }, (_, i) =>
    [170 + i * 123 + (rnd(s + i) - 0.5) * 70, y0 + 40 + rnd(s + i + 50) * 190]);
  const kl = p(T, 0.35, 1.1, enter), d = pts.map(([x, y], i) => `${i ? "L" : "M"}${f1(x)},${f1(y)}`).join("") + `M${f1(pts[2][0])},${f1(pts[2][1])}L${f1(pts[5][0])},${f1(pts[5][1] - 60)}`;
  const linha = `<path d="${d}" fill="none" stroke="${cor.linha}" stroke-width="1.6" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${(1 - kl).toFixed(3)}" opacity="0.85"/>`;
  const extra = [pts[5][0], pts[5][1] - 60];
  const astros = [...pts, extra].map(([x, y], i) => { const k = p(T, 0.25 + i * 0.12, 0.35, pop), r = i === 2 ? 4.2 : 2.2 + rnd(s + i + 90) * 1.6;
    return k > 0 ? estrela(x, y, r * k, cor.estrela, Math.min(1, k)) + (i < 7 ? txt(x + 16, y - 12, GREGAS[i], 22, cor.texto2, { anchor: "start", fonte: "reg", op: p(T, 0.9 + i * 0.08, 0.3) }) : "") : ""; }).join("");
  return linha + astros;
}

export function abertura(T, story, cor) {
  if (T >= 3) return "";
  const v = novoId("tv"), cl = novoId("tc"), linhas = linhasDoNome(story.banda, 10), N = story.shows.length;
  const f = Math.min(460 / (linhas.length * 1.1), ...linhas.map((l) => cabe(l, 880, 170, "anton", 4)));
  const veu = `<linearGradient id="${v}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${cor.bg2}" stop-opacity="0.9"/><stop offset="0.5" stop-color="${cor.bg2}" stop-opacity="0.62"/><stop offset="0.78" stop-color="${cor.bg2}" stop-opacity="0"/></linearGradient>
    <rect width="1080" height="1920" fill="url(#${v})" opacity="${p(T, 0, 0.35).toFixed(3)}"/>`;
  const ceuAlto = `<clipPath id="${cl}"><rect width="1080" height="1250"/></clipPath><g clip-path="url(#${cl})">${nebulosa(T, cor, p(T, 0.05, 1.8), { so: 3 })}${estrelas(T, cor, { op: 0.8 * p(T, 0.1, 0.6) })}</g>`;
  const yNome = 700, nome = linhas.map((l, i) => { const k = p(T, 1.0 + i * 0.15, 0.6, enter), ls = lerp(28, 4, k);
    return txt(540, yNome + (i + 0.86) * f * 1.1, l, f, cor.texto, { fonte: "anton", ls, op: k.toFixed(3) }); }).join("");
  const yFim = yNome + linhas.length * f * 1.1, kd = p(T, 1.5, 0.5, enter);
  const rodape = `<g opacity="${kd.toFixed(3)}" transform="translate(0 ${f1((1 - kd) * 20)})">
    ${txt(540, yFim + 70, "NOVA CONSTELAÇÃO NO CÉU DE HOJE", 26, cor.acento, { fonte: "sb", ls: 7 })}
    ${txt(540, yFim + 140, dataLonga(story.dia), cabe(dataLonga(story.dia), 860, 56, "xb"), cor.texto)}
    ${N > 1 ? txt(540, yFim + 196, `${N} shows`, 36, cor.texto2, { fonte: "sb" }) : ""}</g>`;
  return veu + ceuAlto + txt(540, 320, "HOJE TEM", 44, cor.texto, { fonte: "sb", ls: 16, op: p(T, 0.1, 0.4).toFixed(3) }) +
    constelacao(T, story, cor, 370) + nome + rodape + iris(T, 2.45, cor);
}

// íris: o céu abre em círculo a partir do centro e cobre o clipe (vira o visor da cena seguinte)
function iris(T, at, cor) {
  const k = p(T, at, 0.55, enter);
  if (k <= 0) return "";
  const r = lerp(0, 1150, k), cl = novoId("ti");
  return `<clipPath id="${cl}"><circle cx="540" cy="820" r="${f1(r)}"/></clipPath><g clip-path="url(#${cl})">${ceu(T, cor)}</g>
    <circle cx="540" cy="820" r="${f1(r)}" fill="none" stroke="${cor.acento}" stroke-width="2" opacity="${(1 - k).toFixed(3)}"/>`;
}

// sem logo: o nome em até 3 linhas dentro do visor
function reserva(banda, cx, cy, R, cor) {
  const l = linhasDoNome(banda, 10), f = Math.min(150 / l.length + 40, ...l.map((t) => cabe(t, 2 * R - 140, 120, "anton", 2))), y0 = cy - (l.length * f * 1.08) / 2;
  return l.map((t, i) => txt(cx, y0 + (i + 0.86) * f * 1.08, t, f, cor.texto, { fonte: "anton", ls: 2 })).join("");
}

// anel graduado do visor (marca a cada 5 graus, maior a cada 30)
const anel = (cx, cy, r, cor) => Array.from({ length: 72 }, (_, i) => { const a = (i * 5 * Math.PI) / 180, l = i % 6 ? 9 : 22, c = Math.cos(a), s = Math.sin(a);
  return `M${f1(cx + c * r)},${f1(cy + s * r)} L${f1(cx + c * (r + l))},${f1(cy + s * (r + l))}`; }).join("");

export function cenaLogo(T, story, cor, logoUri) {
  if (T < 3 || T >= 5.5) return "";
  const cx = 540, cy = 820, R = 300, k = p(T, 3.05, 0.7, enter), kr = p(T, 3.0, 1.2, enter);
  const cl = novoId("tl"), vg = novoId("tw"), conta = story.conta || story.banda, { ar, dec } = coordenada(conta), esc = lerp(1.25, 1, k);
  const miolo = logoUri ? `<image href="${logoUri}" x="${cx - R}" y="${cy - R}" width="${2 * R}" height="${2 * R}" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect x="${cx - R}" y="${cy - R}" width="${2 * R}" height="${2 * R}" fill="${cor.bg2}"/>${estrelas(T, cor, { raio: { x: cx, y: cy, r: R } })}` +
      reserva(story.banda, cx, cy, R, cor);
  const ret = cor.reticula, cruz = `M${cx - R},${cy} H${cx - 64} M${cx + 64},${cy} H${cx + R} M${cx},${cy - R} V${cy - 64} M${cx},${cy + 64} V${cy + R}` +
    Array.from({ length: 8 }, (_, i) => { const d = 90 + i * 30; return `M${cx - d},${cy - 7} v14 M${cx + d},${cy - 7} v14 M${cx - 7},${cy - d} h14 M${cx - 7},${cy + d} h14`; }).join("");
  const visor = `<circle cx="${cx}" cy="${cy}" r="${R + 50}" fill="${cor.bg2}" opacity="0.55"/>
    <clipPath id="${cl}"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>
    <g clip-path="url(#${cl})"><g opacity="${k.toFixed(3)}" transform="translate(${cx} ${cy}) scale(${esc.toFixed(4)}) translate(${-cx} ${-cy})">${miolo}</g>
      <radialGradient id="${vg}"><stop offset="0.62" stop-color="${cor.bg2}" stop-opacity="0"/><stop offset="1" stop-color="${cor.bg2}" stop-opacity="0.78"/></radialGradient>
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#${vg})"/></g>
    <path d="${cruz}" stroke="${ret}" stroke-width="1.6" fill="none" opacity="0.9"/>
    <circle cx="${cx}" cy="${cy}" r="64" fill="none" stroke="${ret}" stroke-width="1.4" stroke-dasharray="4 7" opacity="0.9"/>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${cor.linha}" stroke-width="2.4"/>
    <circle cx="${cx}" cy="${cy}" r="${R + 44}" fill="none" stroke="${cor.linha}" stroke-width="1" opacity="0.6"/>
    <g transform="rotate(${f1(lerp(-40, 0, kr))} ${cx} ${cy})"><path d="${anel(cx, cy, R + 8, cor)}" stroke="${cor.linha}" stroke-width="1.3" opacity="0.85"/>
      ${[0, 90, 180, 270].map((g, i) => { const a = (g * Math.PI) / 180;
        return txt(cx + Math.cos(a) * (R + 72), cy + Math.sin(a) * (R + 72) + 9, `${(i * 90 + 270) % 360}°`, 22, cor.texto2, { fonte: "reg" }); }).join("")}</g>`;
  const kc = p(T, 3.35, 0.4, enter), coord = `<g opacity="${kc.toFixed(3)}">${txt(150, 430, `AR ${ar}`, 28, cor.texto2, { anchor: "start", fonte: "sb", ls: 2 })}
    ${txt(930, 430, `DEC ${dec}`, 28, cor.texto2, { anchor: "end", fonte: "sb", ls: 2 })}${txt(cx, 1238, "AUMENTO 120×  ·  FOCO TRAVADO", 22, cor.acento, { fonte: "sb", ls: 5 })}</g>`;
  const kt = p(T, 3.6, 0.45, enter), fc = cabe(conta, 860, 78, "xb");
  const extras = [story.desde ? `na estrada desde ${story.desde}` : "", story.cidadeBase ? `base: ${story.cidadeBase}` : ""].filter(Boolean);
  const texto = `<g opacity="${kt.toFixed(3)}" transform="translate(0 ${f1((1 - kt) * 24)})">${txt(cx, 1340, conta, fc, cor.texto)}
    ${extras.map((l, i) => txt(cx, 1420 + i * 62, l, cabe(l, 820, 44, "sb"), i ? cor.texto2 : cor.texto, { fonte: "sb" })).join("")}</g>`;
  return ceu(T, cor) + cabecalho(250, "OBSERVAÇÃO Nº 01", cor) + visor + coord + texto + fechaIris(T, cor);
}

// a íris termina de abrir no começo da cena (continuidade com a abertura)
const fechaIris = (T, cor) => { const k = p(T, 3.0, 0.35, enter);
  return k < 1 ? `<circle cx="540" cy="820" r="${f1(lerp(300, 1150, k))}" fill="none" stroke="${cor.acento}" stroke-width="2" opacity="${(0.6 * (1 - k)).toFixed(3)}"/>` : ""; };
