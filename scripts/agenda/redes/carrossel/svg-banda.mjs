// Slide por banda (proposta 2b) e slide final de chamada. Selo: foto do perfil colada no ingresso (data URI,
// o librsvg não baixa URL) ou, sem foto, carimbo redondo com as iniciais.
import { H, CREME, CREME2, TINTA, ASSIN, RODAPE, CORES, clamp, n1, esc, dm, diaSem, semanaIso, medir, caber, txt,
  fonte, ticket, abre, fundoIngresso, ingressoGrande, barras } from "./svg-base.mjs";
import { horaCurta } from "../regiao.mjs";

export const MAX_SHOWS_BANDA = 4;

// Quebra em linhas fixas pela largura estimada; corta com reticências se passar de maxL.
export function quebrar(texto, size, f, maxW, maxL) {
  const pal = String(texto || "").trim().split(/\s+/).filter(Boolean), linhas = [];
  let at = "";
  for (const w of pal) { const t = at ? at + " " + w : w; if (medir(t, size, f) <= maxW || !at) at = t; else { linhas.push(at); at = w; } }
  if (at) linhas.push(at);
  if (linhas.length <= maxL) return linhas;
  const l = linhas.slice(0, maxL); let u = l[maxL - 1] + "…";
  while (medir(u, size, f) > maxW && u.length > 2) u = u.slice(0, -2).trimEnd() + "…";
  l[maxL - 1] = u; return l;
}
export function iniciais(nome) {
  const limpo = nome.replace(/\s+/g, "");
  if (limpo.length <= 4) return limpo.toUpperCase();
  return nome.split(/\s+/).filter((w) => /[A-Za-zÀ-ú0-9]/.test(w[0])).slice(0, 3).map((w) => w[0]).join("").toUpperCase();
}
function nomeEmLinhas(nome, maxW, maxSize, minUma) {
  const um = caber(nome, maxSize, "anton", maxW), pal = nome.split(" ");
  if (um >= minUma || pal.length < 2) return { linhas: [nome], size: um };
  let best = null;
  for (let i = 1; i < pal.length; i++) {
    const a = pal.slice(0, i).join(" "), b = pal.slice(i).join(" ");
    const sz = Math.min(caber(a, maxSize, "anton", maxW), caber(b, maxSize, "anton", maxW));
    if (!best || sz > best.size) best = { linhas: [a, b], size: sz };
  }
  return best;
}
function canhotoSemana(cx, y, h, inicio, fim, c, extra) {
  const out = [txt(cx, y + 74, "SEMANA", { f: "xb", size: 18, fill: "#5a554c", anchor: "middle" }),
    txt(cx, y + 160, dm(inicio), { f: "anton", size: 80, fill: TINTA, anchor: "middle" }),
    txt(cx, y + 226, "A " + dm(fim), { f: "anton", size: 54, fill: c.titulo, anchor: "middle" })];
  if (extra) out.push(txt(cx, y + 276, extra, { f: "xb", size: 20, fill: TINTA, anchor: "middle" }));
  const yb = y + h - 92;
  if (yb - (y + 300) > 300) out.push(txt(0, 0, "PEARL JAM AO VIVO", { f: "xb", size: 24, fill: "#5a554c", anchor: "middle", tf: `translate(${cx + 8},${n1((y + 300 + yb) / 2)}) rotate(-90)` }));
  out.push(...barras(cx - 64, 128, yb, 40), txt(cx, yb + 66, `Nº ${semanaIso(inicio)}`, { f: "xb", size: 16, fill: "#5a554c", anchor: "middle" }));
  return out;
}
function selo(p, banda, nome, num, c, fotoHref) {
  const S = 250, fx = 104, fy = 108, fcx = fx + S / 2, fcy = fy + S / 2, sx = fx + S - 6, sy = fy + S - 6;
  if (fotoHref) return [`<g transform="rotate(-3 ${fcx} ${fcy})">`,
    `<rect x="${fx - 14}" y="${fy - 14}" width="${S + 28}" height="${S + 28}" fill="#000" opacity=".3" filter="url(#${p}s)" transform="translate(3,5)"/>`,
    `<rect x="${fx - 14}" y="${fy - 14}" width="${S + 28}" height="${S + 28}" fill="#fffdf6" stroke="${TINTA}" stroke-opacity=".12"/>`,
    `<clipPath id="${p}c"><rect x="${fx}" y="${fy}" width="${S}" height="${S}"/></clipPath>`,
    `<image href="${esc(fotoHref)}" x="${fx}" y="${fy}" width="${S}" height="${S}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${p}c)"/>`,
    `<rect x="${fx}" y="${fy}" width="${S}" height="${S}" fill="url(#${p}g)"/>`, "</g>",
    `<rect x="-66" y="-17" width="132" height="34" fill="${CREME}" opacity=".82" stroke="${TINTA}" stroke-opacity=".08" transform="translate(${fcx},${fy - 10}) rotate(4)"/>`,
    `<g transform="rotate(14 ${sx} ${sy})" mask="url(#${p}m)">`,
    `<circle cx="${sx}" cy="${sy}" r="54" fill="${CREME2}" opacity=".55"/>`,
    `<circle cx="${sx}" cy="${sy}" r="54" fill="none" stroke="${c.titulo}" stroke-width="4"/>`,
    `<circle cx="${sx}" cy="${sy}" r="45" fill="none" stroke="${c.titulo}" stroke-width="1.5"/>`,
    txt(sx, sy - 16, "SEMANA", { f: "xb", size: 12, fill: c.titulo, anchor: "middle" }),
    txt(sx, sy + 24, String(num), { f: "anton", size: 38, fill: c.titulo, anchor: "middle" }), "</g>"];
  const R = 124, ini = iniciais(banda.nome), anel = `${nome} · ${banda.desde ? "DESDE " + banda.desde + " · " : ""}`;
  const isz = caber(ini, 132, "anton", 160);
  let ringSz = 19; while (medir(anel, ringSz, "xb") > 2 * Math.PI * 108 * .96 && ringSz > 12) ringSz--;
  return [`<g transform="rotate(-8 ${fcx} ${fcy})" mask="url(#${p}m)">`,
    `<circle cx="${fcx}" cy="${fcy}" r="${R}" fill="${c.titulo}" opacity=".06"/>`,
    `<circle cx="${fcx}" cy="${fcy}" r="${R}" fill="none" stroke="${c.titulo}" stroke-width="6"/>`,
    `<circle cx="${fcx}" cy="${fcy}" r="${R - 28}" fill="none" stroke="${c.titulo}" stroke-width="2.5"/>`,
    `<path id="${p}r" d="M${fcx},${fcy + 108} A108,108 0 1 1 ${fcx},${fcy - 108} A108,108 0 1 1 ${fcx},${fcy + 108}" fill="none"/>`,
    `<text ${fonte("xb")} font-size="${ringSz}" fill="${c.titulo}"><textPath href="#${p}r">${esc(anel)}</textPath></text>`,
    txt(fcx, fcy + isz * .87 / 2, ini, { f: "anton", size: isz, fill: c.titulo, anchor: "middle" }), "</g>"];
}

// banda: { nome, cidade?, uf?, desde?, resumo? } · shows: [{ data, casa?, cidade?, uf? }] · fotoHref: data URI ou null.
export function svgBanda(banda, shows, inicio, fim, corId = "azul", fotoHref = null, p = "bd") {
  const c = CORES[corId], nome = banda.nome.toUpperCase();
  const lista = shows.slice().sort((a, b) => a.data.localeCompare(b.data)).slice(0, MAX_SHOWS_BANDA);
  const out = [abre, ...fundoIngresso(p, corId)];
  const TX = 60, TY = 56, TW = 960, SX = 800, CX = 100, CW = 660;
  const nm = nomeEmLinhas(nome, CW, 124, 92), lh = nm.size * .98, nomeTop = 412;
  const nomeBase = nm.linhas.map((_, i) => nomeTop + nm.size * .87 + i * lh);
  const res = banda.resumo ? quebrar(banda.resumo, 26, "sb", CW, 3) : [];
  const resTop = nomeBase[nomeBase.length - 1] + 54;
  const fim0 = res.length ? resTop + (res.length - 1) * 38 : nomeBase[nomeBase.length - 1];
  const TH = Math.max(560, Math.round(fim0 + 44 - TY));
  out.push(...ingressoGrande(p, TX, TY, TW, TH, SX, CREME2), ...selo(p, banda, nome, semanaIso(inicio), c, fotoHref));
  const RX = 410, RW = 360;
  out.push(txt(RX, 142, ASSIN, { f: "pf", size: 24, fill: TINTA }), txt(RX, 178, "AGENDA DA SEMANA", { f: "xb", size: 18, fill: "#5a554c" }));
  let ry = 288;
  const cid = banda.cidade ? [banda.cidade, banda.uf].filter(Boolean).join("/").toUpperCase() : null;
  if (cid) { out.push(txt(RX, ry, cid, { f: "anton", size: caber(cid, 62, "anton", RW), fill: c.titulo })); ry += 44; }
  if (banda.desde) out.push(txt(RX, ry, `NA ESTRADA DESDE ${banda.desde}`, { f: "xb", size: caber(`NA ESTRADA DESDE ${banda.desde}`, 22, "xb", RW), fill: TINTA }));
  nm.linhas.forEach((l, i) => out.push(txt(CX, nomeBase[i], l, { f: "anton", size: nm.size, fill: TINTA })));
  res.forEach((l, i) => out.push(txt(CX, resTop + i * 38, l, { f: "sb", size: 26, fill: "#3d3a34" })));
  out.push(...canhotoSemana(910, TY, TH, inicio, fim, c, `${lista.length} ${lista.length === 1 ? "SHOW" : "SHOWS"}`));

  const y0 = TY + TH + 34, y1 = 1236, BH = 104, GAP = 16, n = lista.length;
  const s = clamp((y1 - y0) / (n * BH + (n - 1) * GAP), .72, 1.3), h = BH * s, gap = GAP * s;
  let y = y0 + Math.max(0, (y1 - y0 - (n * h + (n - 1) * gap)) / 2);
  const sx = 250, X = 284, XR = 990;
  lista.forEach((sh, i) => {
    const rot = i % 2 ? .5 : -.5, dx = (i % 3 - 1) * 6, tp = ticket(60, y, 960, h, sx, 12 * s);
    const cidS = sh.cidade ? [sh.cidade, sh.uf].filter(Boolean).join("/").toUpperCase() : null;
    const casa = sh.casa ? "@" + sh.casa : sh.casaNome || null;
    // horário (quando a banda divulga) vai na linha de baixo, junto da casa: "@casa · 22h"
    const lead = cidS || casa || "LOCAL A CONFIRMAR";
    const sub = [cidS ? casa : null, sh.hora ? horaCurta(sh.hora) : null].filter(Boolean).join(" · ") || null;
    out.push(`<g transform="translate(${dx},0) rotate(${rot} 540 ${n1(y + h / 2)})">`,
      `<path d="${tp}" fill="#000" opacity=".35" filter="url(#${p}s)" transform="translate(4,6)"/>`,
      `<path d="${tp}" fill="${i % 2 ? CREME2 : CREME}"/><path d="${tp}" fill="url(#${p}g)"/>`,
      `<line x1="${sx}" y1="${n1(y + 18 * s)}" x2="${sx}" y2="${n1(y + h - 18 * s)}" stroke="${TINTA}" stroke-width="4" stroke-linecap="round" stroke-dasharray="0 11" opacity=".35"/>`,
      txt(155, y + 40 * s, diaSem(sh.data), { f: "xb", size: 24 * s, fill: c.titulo, anchor: "middle" }),
      txt(155, y + 88 * s, dm(sh.data), { f: "anton", size: 48 * s, fill: TINTA, anchor: "middle" }),
      txt(X, y + (sub ? 56 : 68) * s, lead, { f: "anton", size: caber(lead, 50 * s, "anton", XR - X), fill: TINTA }));
    if (sub) out.push(txt(X, y + 88 * s, sub, { f: "xb", size: caber(sub, 26 * s, "xb", XR - X), fill: c.titulo }));
    out.push("</g>");
    y += h + gap;
  });
  out.push(txt(540, 1304, RODAPE, { f: "sb", size: 28, fill: CREME2, anchor: "middle" }), "</svg>");
  return out.join("\n");
}

// Último slide: chamada pras bandas.
export function svgChamada(inicio, fim, corId = "azul", p = "ch") {
  const c = CORES[corId], TX = 60, TY = 150, TW = 960, TH = 900, SX = 800, CX = 100, CW = 660;
  return [abre, ...fundoIngresso(p, corId), ...ingressoGrande(p, TX, TY, TW, TH, SX, CREME2),
    txt(CX, TY + 84, ASSIN, { f: "pf", size: 30, fill: TINTA }),
    txt(CX, TY + 270, "TOCA", { f: "anton", size: 180, fill: c.titulo }),
    txt(CX, TY + 440, "PEARL JAM", { f: "anton", size: caber("PEARL JAM", 180, "anton", CW), fill: c.titulo }),
    txt(CX, TY + 540, "E QUER APARECER AQUI?", { f: "anton", size: caber("E QUER APARECER AQUI?", 66, "anton", CW), fill: TINTA }),
    `<line x1="${CX}" y1="${TY + 600}" x2="${CX + CW}" y2="${TY + 600}" stroke="${TINTA}" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round" opacity=".5"/>`,
    txt(CX, TY + 690, "Fale com a gente no", { f: "sb", size: 40, fill: "#3d3a34" }),
    txt(CX, TY + 820, "@smufdpj", { f: "anton", size: 120, fill: TINTA }),
    ...canhotoSemana(910, TY, TH, inicio, fim, c, null),
    txt(540, H - 150, "somaisumfadepearljam.com.br/agenda", { f: "anton", size: 54, fill: CREME2, anchor: "middle" }), "</svg>"].join("\n");
}
