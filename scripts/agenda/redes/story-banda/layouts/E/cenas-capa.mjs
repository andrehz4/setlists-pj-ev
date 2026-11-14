// Layout E ("Bilhete"), cenas 1 (0 a 3: painel sobre o clipe com "HOJE TEM", o nome em serifa itálica e a data, a
// moldura dourada se desenhando) e 2 (3 a 5.5: logo num medalhão com aros e marcas de mostrador, nome, desde, @ e base).
import { pr, out, io, lerp, f1, fade, rotulo, orn, moldura, txt, quebra, caber, dataDe } from "./pecas.mjs";

// bloco da abertura: centrado em y 1100
function blocoAbertura(story) {
  const nm = quebra(story.banda, 940, 3, 260, 90), n = nm.linhas.length, F = nm.F;
  const h = 30 + 50 + 0.8 * F + 0.95 * F * (n - 1) + 100, y0 = 1100 - h / 2;
  const linhas = nm.linhas.map((t, i) => ({ t, y: y0 + 80 + 0.8 * F + 0.95 * F * i, at: 0.15 + 0.15 * i }));
  const data = linhas.at(-1).y + 96;
  return { F, y0, linhas, data, topo: y0 - 90, base: data + 80 };
}

export function abertura(T, story, cor) {
  if (T >= 3) return "";
  const B = blocoAbertura(story), d = dataDe(story.dia);
  const abre = pr(T, 0, 0.5, io), cresce = pr(T, 2.6, 0.4, io), some = 1 - pr(T, 2.5, 0.3, io);
  const c = (B.topo + B.base) / 2, h0 = ((B.base - B.topo) / 2) * abre;
  const y0 = lerp(c - h0, 0, cresce), y1 = lerp(c + h0, 1920, cresce);
  const painel = y1 > y0 ? `<rect x="0" y="${f1(y0)}" width="1080" height="${f1(y1 - y0)}" fill="${cor.bg}"
    fill-opacity="${lerp(0.92, 1, cresce).toFixed(3)}"/>` : "";
  const miolo = rotulo(540, B.y0 + 28, "HOJE TEM", pr(T, 0.1, 0.5, out), cor.gold) +
    orn(540, B.y0 + 72, 360, pr(T, 0.15, 0.6, io), cor.gold) +
    B.linhas.map((l) => fade(540, l.y, l.t, B.F, cor.paper, pr(T, l.at, 0.6, out))).join("") +
    fade(540, B.data, `${d.dia}, ${d.d} de ${d.mes}`, 48, cor.gold, pr(T, 0.6, 0.6, out), { fonte: "pf5" });
  return painel + moldura(pr(T, 0.05, 0.9, io), cor.gold) + (some > 0 ? `<g opacity="${some.toFixed(3)}">${miolo}</g>` : "");
}

// sem logo: o nome da banda em serifa no papel do medalhão
function reserva(story, cx, cy, cor) {
  const nm = quebra(story.banda, 420, 3, 120, 50), passo = nm.F * 0.95, h = passo * (nm.linhas.length - 1);
  return nm.linhas.map((l, i) => txt(cx, cy - h / 2 + i * passo + nm.F * 0.3, l, nm.F, cor.bg)).join("");
}

function medalhao(T, story, cor, logoUri) {
  const cx = 540, cy = 760, R = 290, id = `elogo${story.contaPura || "x"}`.replace(/[^\w]/g, "");
  const aro = (r, t, sw) => {
    const P = 2 * Math.PI * r, p = pr(T, t, 0.75, io);
    if (p <= 0) return "";
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${cor.gold}" stroke-width="${sw}"
      stroke-dasharray="${f1(P)}"` +
      ` stroke-dashoffset="${f1(P * (1 - p))}" transform="rotate(-90 ${cx} ${cy})"/>`;
  };
  const marcas = pr(T, 3.25, 0.7, io), lg = pr(T, 3.2, 0.6, out);
  let tic = "";
  for (let k = 0; k < 72 && k / 72 < marcas; k++) {
    tic += `<rect x="${cx - 1}" y="${cy - R - 46}" width="2" height="${k % 6 ? 8 : 16}" fill="${cor.gold}"
      transform="rotate(${k * 5} ${cx} ${cy})"/>`;
  }
  const img = logoUri
    ? `<image href="${logoUri}" x="${cx - R}" y="${cy - R}" width="${2 * R}" height="${2 * R}"
      preserveAspectRatio="xMidYMid slice"/>`
    : reserva(story, cx, cy, cor);
  const s = lerp(1.06, 1, lg);
  const logo = lg > 0 ? `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${R - 4}"/></clipPath>
    <g clip-path="url(#${id})" opacity="${lg.toFixed(3)}">
    <g transform="translate(${cx} ${cy}) scale(${s.toFixed(4)}) translate(${-cx} ${-cy})">
    <rect x="${cx - R}" y="${cy - R}" width="${2 * R}" height="${2 * R}" fill="${cor.paper}"/>${img}</g></g>` : "";
  return aro(R + 10, 3.05, 3) + aro(R + 26, 3.15, 1.2) + tic + logo;
}

export function cenaLogo(T, story, cor, logoUri) {
  if (T < 3 || T >= 5.5) return "";
  const base = String(story.cidadeBase || "").replace("/", " · ");
  const linhas = [
    story.desde ? { t: `desde ${story.desde}`, f: 60, fonte: "pf7", fill: cor.gold, at: 3.8 } : null,
    story.conta ? { t: story.conta, f: Math.min(36, caber(story.conta, 900, 36, "in")), fonte: "in", ls: 0.06,
      fill: cor.paper, at: 3.95 } : null,
    base ? { t: base, f: Math.min(56, caber(base, 900, 56)), fonte: "is", fill: cor.paper, at: 4.05 } : null,
  ].filter(Boolean);
  // posições do desenho (1340, 1420, 1500); faltando o "desde", as outras sobem pra não deixar buraco
  const ys = linhas.length === 3 ? [1340, 1420, 1500] : [1350, 1440];
  const fNome = caber(story.banda, 900, 110);
  return rotulo(540, 300, "SÓ MAIS UM FÃ DE PEARL JAM APRESENTA", pr(T, 3.05, 0.5, out), cor.gold, 26) +
    medalhao(T, story, cor, logoUri) +
    fade(540, 1190, story.banda, fNome, cor.paper, pr(T, 3.5, 0.6, out)) +
    orn(540, 1250, 420, pr(T, 3.7, 0.6, io), cor.gold) +
    linhas.map((l, i) => fade(540, ys[i], l.t, l.f, l.fill, pr(T, l.at, 0.6, out), { fonte: l.fonte, ls: l.ls || 0 })).join("");
}
