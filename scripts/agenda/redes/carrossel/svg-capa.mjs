// Capa do carrossel (1º slide, proposta 1b "Ingressos"): cabeçalho é um ingresso grande com canhoto da semana,
// cada show é um ingresso com a data no canhoto. Até 9 shows por página; semana cheia ganha uma 2ª página
// (montar.mjs) e só o que passar das páginas vira "+ N show(s)" acima do rodapé.
import { W, H, CREME, CREME2, TINTA, ASSIN, RODAPE, CORES, clamp, n1, dm, diaSem, semanaIso, medir, caber,
  txt, tspan, grao, ticket, abre, barras } from "./svg-base.mjs";

export const MAX_CAPA = 9;
export const Y_RESTO = 1220, Y_RODAPE = 1304;

// lista: shows de shows.json ({ data, nome, casa?, cidade?, uf? }) da semana.
export function prepararCapa(lista, max = MAX_CAPA) {
  const todos = lista.slice().sort((a, b) => a.data.localeCompare(b.data)).map((s) => ({
    data: s.data, dia: diaSem(s.data), dm: dm(s.data), nome: String(s.nome || "").toUpperCase(),
    casa: s.casa ? "@" + s.casa : null,
    cidade: s.cidade ? [s.cidade, s.uf].filter(Boolean).join("/") : null,
  }));
  return { mostrar: todos.slice(0, max), resto: Math.max(0, todos.length - max) };
}

// parte: "1/2", "2/2" (null = página única) · resto: shows que não couberam em nenhuma página.
export function svgCapa(lista, inicio, fim, corId = "azul", p = "cp", { parte = null, resto = null } = {}) {
  const c = CORES[corId], d = prepararCapa(lista), escuro = corId === "preto", num = semanaIso(inicio);
  if (resto != null) d.resto = resto;
  const out = [abre, `<defs>
<pattern id="${p}h" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="8" cy="8" r="2.2" fill="${escuro ? CREME : "#000"}" opacity="${escuro ? .06 : .13}"/></pattern>
${grao(p + "g", TINTA, 4, 70, 150, .5, 1.4, .05, .14)}
<filter id="${p}s" x="-5%" y="-20%" width="110%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>
</defs>`,
    `<rect width="${W}" height="${H}" fill="${c.base}"/>${escuro ? "" : `<rect width="${W}" height="${H}" fill="#000" opacity=".22"/>`}<rect width="${W}" height="${H}" fill="url(#${p}h)"/>`];

  const hx = 60, hy = 56, hw = 960, hh = 330, hs = 780, hp = ticket(hx, hy, hw, hh, hs, 22);
  out.push(`<path d="${hp}" fill="#000" opacity=".4" filter="url(#${p}s)" transform="translate(6,9)"/>`,
    `<path d="${hp}" fill="${CREME2}"/><path d="${hp}" fill="url(#${p}g)"/>`,
    `<line x1="${hs}" y1="${hy + 34}" x2="${hs}" y2="${hy + hh - 34}" stroke="${TINTA}" stroke-width="5" stroke-linecap="round" stroke-dasharray="0 14" opacity=".35"/>`,
    txt(100, 114, ASSIN, { f: "pf", size: 30, fill: TINTA }),
    txt(748, 114, parte ? `Nº ${num} · PARTE ${parte}` : `Nº ${num}`, { f: "xb", size: 18, fill: "#5a554c", anchor: "end" }),
    txt(94, 298, "AGENDA", { f: "anton", size: 196, fill: c.titulo }),
    txt(98, 362, "DA SEMANA", { f: "anton", size: 58, fill: TINTA }),
    txt(900, 130, "SEMANA", { f: "xb", size: 18, fill: "#5a554c", anchor: "middle" }),
    txt(900, 222, dm(inicio), { f: "anton", size: 84, fill: TINTA, anchor: "middle" }),
    txt(900, 292, "A " + dm(fim), { f: "anton", size: 56, fill: c.titulo, anchor: "middle" }),
    ...barras(836, 128, 318, 42, 23));

  const y0 = 422, y1 = d.resto ? 1176 : 1222, BH = 92, GAP = 14, n = d.mostrar.length;
  const s = clamp((y1 - y0) / (n * BH + (n - 1) * GAP), .7, 1.75), h = BH * s, gap = GAP * s;
  let y = y0 + Math.max(0, (y1 - y0 - (n * h + (n - 1) * gap)) / 2);
  const tx = 60, tw = 960, sx = 250, X = 284, XR = 990;
  d.mostrar.forEach((sh, i) => {
    const rot = i % 2 ? .5 : -.5, dx = (i % 3 - 1) * 6, tp = ticket(tx, y, tw, h, sx, 12 * s);
    out.push(`<g transform="translate(${dx},0) rotate(${rot} 540 ${n1(y + h / 2)})">`,
      `<path d="${tp}" fill="#000" opacity=".35" filter="url(#${p}s)" transform="translate(4,6)"/>`,
      `<path d="${tp}" fill="${i % 2 ? CREME2 : CREME}"/><path d="${tp}" fill="url(#${p}g)"/>`,
      `<line x1="${sx}" y1="${n1(y + 18 * s)}" x2="${sx}" y2="${n1(y + h - 18 * s)}" stroke="${TINTA}" stroke-width="4" stroke-linecap="round" stroke-dasharray="0 11" opacity=".35"/>`,
      txt(155, y + 36 * s, sh.dia, { f: "xb", size: 22 * s, fill: c.titulo, anchor: "middle" }),
      txt(155, y + 80 * s, sh.dm, { f: "anton", size: 44 * s, fill: TINTA, anchor: "middle" }),
      txt(X, y + 50 * s, sh.nome, { f: "anton", size: caber(sh.nome, 46 * s, "anton", XR - X), fill: TINTA }));
    const partes = [];
    if (sh.cidade) partes.push([sh.cidade.toUpperCase(), "xb", c.texto]);
    if (sh.casa) partes.push([sh.casa, "sb", "#3d3a34"]);
    if (!partes.length) partes.push(["local a confirmar", "sb", "#3d3a34"]);
    // Separação explícita (dx): o SVG junta os espaços entre tspans e saía "FRANCA/SP@therootsfranca".
    const SEP = 14, w = partes.reduce((a, [t, f]) => a + medir(t, 22 * s, f), 0) + SEP * (partes.length - 1);
    const fs = w > XR - X ? 22 * s * (XR - X) / w : 22 * s;
    const spans = partes.map(([t, f, cor], k) => tspan(t, { f, size: fs, fill: cor }).replace("<tspan ", k ? `<tspan dx="${SEP}" ` : "<tspan "));
    out.push(`<text x="${X}" y="${n1(y + 80 * s)}">${spans.join("")}</text>`, "</g>");
    y += h + gap;
  });
  if (d.resto) out.push(txt(60, Y_RESTO, `+ ${d.resto} show(s) na agenda do site`, { f: "xb", size: 30, fill: CREME2 }));
  out.push(txt(540, Y_RODAPE, RODAPE, { f: "sb", size: 28, fill: CREME2, anchor: "middle" }), "</svg>");
  return out.join("\n");
}
