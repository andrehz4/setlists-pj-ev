// Layout S, cenas 4 (pórtico sobre a pista: uma placa verde por show vem da estrada e encaixa, com cidade, hora e a
// casa na faixa branca de baixo, 9 a 12.5) e 5 (outdoor de beira de estrada colado faixa a faixa pedindo pra
// compartilhar, refletores, e a placa "Siga @smufdpj" com o site, 12.5 a 15).
import { p, pop, enter, lerp } from "../../tempo.mjs";
import { placa, poste, preferencia, texto, cabe, largura, novoId, f1 } from "./pecas.mjs";
import { paisagem, climaPorCima } from "./estrada.mjs";

const hora = (h) => (h ? String(h).replace(/^(\d{1,2}):?(\d{2})?$/, (_, a, b) => `${Number(a)}h${b && b !== "00" ? b : ""}`) : "");

// Pórtico: duas colunas e a treliça em cima (banzos + diagonais em zigue-zague)
function portico(cor, yv) {
  const zig = Array.from({ length: 24 }, (_, i) => `${f1(40 + i * 42.5)},${i % 2 ? yv + 8 : yv + 52}`).join(" L");
  return poste(66, yv, 2000, 40, cor) + poste(1014, yv, 2000, 40, cor) +
    `<rect x="30" y="${yv}" width="1020" height="9" fill="${cor.metal2}"/><rect x="30" y="${yv + 52}" width="1020" height="9" fill="${cor.metal2}"/>
    <path d="M${zig}" fill="none" stroke="${cor.metal1}" stroke-width="4"/><rect x="30" y="${yv}" width="1020" height="3" fill="#fff" opacity="0.35"/>`;
}

// nome da cidade em 1 linha ou, se ficar miúdo e tiver espaço, em 2 (quebra na palavra que equilibra melhor)
function nomeCidade(cidade, livre, max, alturaUtil) {
  const f1l = cabe(cidade, livre, max), p = cidade.split(" ");
  if (p.length < 2 || f1l > max * 0.7) return { linhas: [cidade], f: f1l };
  let melhor = null;
  for (let i = 1; i < p.length; i++) { const l = [p.slice(0, i).join(" "), p.slice(i).join(" ")], f = Math.min(...l.map((t) => cabe(t, livre, max)), alturaUtil / 2.45);
    if (!melhor || f > melhor.f) melhor = { linhas: l, f }; }
  return melhor.f > f1l * 1.15 ? melhor : { linhas: [cidade], f: f1l };
}

function placaShow(sh, i, { x, y, w, h }, cor) {
  const hh = hora(sh.hora) || "ver perfil", faixa = Math.round(h * 0.28), util = h - faixa - 50;
  const fh = Math.min(80, h * 0.26) * (sh.hora ? 1 : 0.62), lh = largura(hh, fh, "xb"), xc = x + 136, livre = x + w - 50 - lh - 36 - xc;
  const { linhas, f: fc } = nomeCidade(sh.cidade, livre, Math.min(110, h * 0.3), util);
  const passo = fc * 1.04, yBase = y + 18 + (util - passo * linhas.length) / 2 + fc * 0.8, yMeio = yBase - fc * 0.36 + ((linhas.length - 1) * passo) / 2;
  const casa = sh.casa || "casa no perfil da banda", fcasa = cabe(casa, w - 120, Math.min(50, faixa * 0.55), "b");
  const yf = y + h - faixa - 16;
  const miolo = `<circle cx="${x + 74}" cy="${f1(yMeio)}" r="34" fill="${cor.branco}"/>${texto(x + 74, yMeio + 13, String(i + 1), 38, cor.placa2)}
    ${linhas.map((l, j) => texto(xc, yBase + j * passo, l, fc, cor.branco, { anchor: "start" })).join("")}${texto(x + w - 50, yMeio + fh * 0.36, hh, fh, cor.horaCor || cor.acento, { anchor: "end" })}
    <rect x="${x + 22}" y="${f1(yf)}" width="${w - 44}" height="${faixa}" rx="8" fill="${cor.branco}"/>
    ${texto(540, yf + faixa / 2 + fcasa * 0.36, casa, fcasa, cor.placa2, { fonte: "b" })}`;
  return placa({ x, y, w, h, cor }, miolo);
}

export function cenaShows(T, story, cor) {
  if (T < 9 || T >= 12.5) return "";
  const N = story.shows.length, gap = 34, alto = Math.min(N === 1 ? 400 : 330, (980 - (N - 1) * gap) / N), y0 = 470;
  const vx = 540, vy = 1500;
  const itens = story.shows.map((sh, i) => {
    const k = p(T, 9.2 + i * 0.42, 0.65, enter);
    if (k <= 0) return "";
    const s = 1 / lerp(12, 1, k), y = y0 + i * (alto + gap);
    const braco = `<rect x="86" y="${f1(y + alto * 0.3)}" width="38" height="16" fill="${cor.metal2}"/><rect x="956" y="${f1(y + alto * 0.3)}" width="38" height="16" fill="${cor.metal2}"/>`;
    return `<g opacity="${Math.min(1, k * 3).toFixed(3)}" transform="translate(${vx} ${vy}) scale(${s.toFixed(4)}) translate(${-vx} ${-vy})">${k >= 1 ? braco : ""}${placaShow(sh, i, { x: 110, y, w: 860, h: alto }, cor)}</g>`;
  }).join("");
  const kt = p(T, 9.05, 0.4, enter), som = `<g opacity="${kt.toFixed(3)}">${texto(543, 343, "SHOWS DE HOJE", 70, "#000", { ls: 4, op: 0.35 })}${texto(540, 340, "SHOWS DE HOJE", 70, "#fff", { ls: 4 })}</g>`;
  return paisagem(T, cor, { hz: 1500, vel: 2.4 }) + portico(cor, 384) + som + itens + climaPorCima(T, cor);
}

// Outdoor: moldura de aço, cartaz em 4 faixas coladas uma a uma, passarela com guarda-corpo e 3 refletores
function outdoor(T, cor) {
  const B = { x: 60, y: 330, w: 960, h: 620 }, l = ["COMPARTILHA", "COM QUEM VAI", "COM VOCÊ"], cl = novoId("so");
  const f = Math.min(...l.map((t) => cabe(t, B.w - 110, 158, "anton", 2))), passo = f * 1.16, y0 = B.y + (B.h - passo * 3) / 2 - f * 0.08;
  const faixas = [0, 1, 2, 3].map((i) => { const k = p(T, 12.6 + i * 0.14, 0.3, enter);
    return `<rect x="${f1(B.x + (i * B.w) / 4)}" y="${B.y}" width="${f1(B.w / 4 + 1)}" height="${f1(B.h * k)}"/>`; }).join("");
  const costuras = [1, 2, 3].map((i) => `<path d="M${f1(B.x + (i * B.w) / 4)},${B.y} V${B.y + B.h}" stroke="#000" stroke-width="1.5" opacity="0.12"/>`).join("");
  const cartaz = `<clipPath id="${cl}">${faixas}</clipPath><g clip-path="url(#${cl})"><rect x="${B.x}" y="${B.y}" width="${B.w}" height="${B.h}" fill="${cor.cartaz}"/>
    <rect x="${B.x}" y="${B.y + B.h - 34}" width="${B.w}" height="34" fill="${cor.cartazAcento}"/>
    ${l.map((t, i) => texto(540, y0 + (i + 0.86) * passo, t, f, i === 2 ? cor.cartazAcento : cor.cartazTinta, { fonte: "anton", ls: 2 })).join("")}${costuras}</g>`;
  const pernas = [300, 780].map((x) => poste(x, B.y + B.h, 1440, 46, cor)).join("");
  const yp = B.y + B.h + 40, grade = Array.from({ length: 25 }, (_, i) => `M${100 + i * 36},${yp - 46} V${yp}`).join("");
  const passarela = `<rect x="80" y="${yp}" width="920" height="14" fill="${cor.metal2}"/><path d="M80,${yp - 46} H1000 ${grade}" stroke="${cor.metal1}" stroke-width="3" fill="none"/>`;
  const noite = cor.reflexo > 0.3, acesos = p(T, 13.0, 0.2, enter);
  const luzes = [240, 540, 840].map((x) => `<path d="M${x},${B.y - 10} V${B.y - 70} H${x + 30}" fill="none" stroke="${cor.metal2}" stroke-width="7"/>
    <rect x="${x + 18}" y="${B.y - 88}" width="58" height="26" rx="6" fill="${cor.metal2}"/>${noite ? `<path d="M${x + 22},${B.y - 64} L${x + 72},${B.y - 64} L${x + 210},${B.y + 300} L${x - 120},${B.y + 300} Z" fill="url(#${cl}l)" opacity="${acesos.toFixed(3)}"/>` : ""}`).join("");
  const cone = `<linearGradient id="${cl}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d0" stop-opacity="0.35"/><stop offset="1" stop-color="#fff6d0" stop-opacity="0"/></linearGradient>`;
  return pernas + passarela + `<rect x="${B.x - 16}" y="${B.y - 16}" width="${B.w + 32}" height="${B.h + 32}" fill="${cor.metal2}"/><rect x="${B.x - 16}" y="${B.y - 16}" width="${B.w + 32}" height="5" fill="#fff" opacity="0.3"/>
    <rect x="${B.x}" y="${B.y}" width="${B.w}" height="${B.h}" fill="#1a1a1a" opacity="0.85"/>${cartaz}${cone}${luzes}`;
}

export function cenaFinal(T, story, cor) {
  if (T < 12.5) return "";
  const site = "somaisumfadepearljam.com.br/agenda", x = 130, w = 820, y = 1430, h = 250, faixa = 82;
  const k = p(T, 13.4, 0.5, pop), fs = cabe(site, w - 90, 42, "b");
  const miolo = texto(540, y + 108, "Siga @smufdpj", cabe("Siga @smufdpj", w - 120, 80), cor.branco) +
    `<rect x="${x + 22}" y="${y + h - faixa - 18}" width="${w - 44}" height="${faixa}" rx="8" fill="${cor.branco}"/>` +
    texto(540, y + h - 18 - faixa / 2 + fs * 0.36, site, fs, cor.placa2, { fonte: "b" });
  const pes = [x + 180, x + w - 180].map((px) => poste(px, y + h - 10, 2000, 28, cor)).join("");
  return paisagem(T, cor, { hz: 1300, vel: 0.3 }) + preferencia(985, 1170, 0.42, cor, 1345) + outdoor(T, cor) +
    `<g transform="translate(0 ${f1((1 - k) * 520)})">${pes}${placa({ x, y, w, h, cor }, miolo)}</g>` + climaPorCima(T, cor);
}
