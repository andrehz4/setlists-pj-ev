// Layout H, cenas 1 (abertura sobre o clipe, 0 a 3), 2 (disco com o logo, 3 a 5.5) e 3 (mapa no selo, 5.5 a 9).
import { p, pop, enter, move, lerp } from "../../tempo.mjs";
import { ufs } from "../../../mapa.mjs";
import { mundo, caixaDe, enquadra, tela, caminho, afastar } from "../../mapa-comum.mjs";
import { nomeUf } from "../../../voz.mjs";
import { linhasDoNome } from "../G/placas.mjs";
import { disco, braco, adesivo, sobe, iris, cabe, esc, RPM33, F_ARCHIVO, F_SERIF, F_INTER_XB } from "./pecas.mjs";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
export const dataLonga = (dia) => { const d = new Date(`${dia}T12:00:00Z`); return `${DIAS[d.getUTCDay()]}, ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`; };
export const fundo = (cor) => `<rect width="1080" height="1920" fill="${cor.bg}"/>`;

export function abertura(T, story, cor) {
  if (T >= 3) return "";
  const linhas = linhasDoNome(story.banda, 9), f = Math.min(...linhas.map((l) => cabe(l, 960, 210)));
  const y0 = 1000 - (linhas.length * f * 1.02) / 2 + f * 0.8;
  const nome = linhas.map((l, i) => sobe(p(T, 0.35 + i * 0.12, 0.45, enter), { x: 60, y: y0 + i * f * 1.02, f, texto: l, fill: "#ffffff", sombra: cor.disco })).join("");
  const N = story.shows.length;
  const data = `<text x="60" y="${(y0 + linhas.length * f * 1.02 + 30).toFixed(1)}" font-family="${F_SERIF}" font-style="italic" font-size="64" fill="#ffffff" opacity="${p(T, 1.0, 0.35, enter).toFixed(3)}">${esc(dataLonga(story.dia))}${N > 1 ? ` · ${N} shows` : ""}</text>`;
  const s = p(T, 0.15, 0.4, pop);
  const sticker = s > 0 ? adesivo({ cx: 820, cy: 470, r: 140, rot: -12, s, fundo: cor.acento, cor: cor.sobreAcento, linhas: ["HOJE", "AO VIVO"] }) : "";
  const veu = `<rect width="1080" height="1920" fill="#000" opacity="${(0.3 * p(T, 0, 0.3, enter)).toFixed(3)}"/>`;
  return veu + sticker + nome + data + iris(p(T, 2.4, 0.55, move), 820, 470, cor.bg);
}

export function cenaDisco(T, story, cor, logoUri) {
  if (T < 3 || T >= 5.5) return "";
  const cx = lerp(-520, 540, p(T, 3.0, 0.6, move)), ang = (T - 3) * RPM33;
  const arm = lerp(-38, -4, p(T, 3.55, 0.6, move));
  const base = story.cidadeBase || "";
  const l1 = story.desde ? `desde ${story.desde}` : "ao vivo", k = (t) => p(T, t, 0.4, enter);
  return fundo(cor) + `<text x="60" y="300" font-family="${F_INTER_XB}" font-weight="800" font-size="28" letter-spacing="6" fill="${cor.tinta}" opacity="${k(3.1).toFixed(3)}">LADO A · FAIXA 1</text>` +
    disco(T, { cx, cy: 820, r: 420, ang, cor, logoUri, selo: story.banda.split(/\s+/)[0].toUpperCase() }) +
    braco({ px: 960, py: 330, ang: arm, cor }) +
    sobe(k(3.5), { x: 60, y: 1380, f: 72, texto: l1, fill: cor.tinta, familia: F_SERIF }) +
    sobe(k(3.7), { x: 60, y: 1480, f: cabe(story.conta, 960, 72), texto: story.conta, fill: cor.tinta }) +
    (base ? sobe(k(3.9), { x: 60, y: 1560, f: 34, texto: base.toUpperCase(), fill: cor.acento, familia: F_INTER_XB }) : "");
}

const RS = { x: 110, y: 640, w: 860, h: 860 };
export function cenaMapa(T, story, cor) {
  if (T < 5.5 || T >= 9) return "";
  const ufsShow = [...new Set(story.shows.map((s) => s.uf))];
  const titulo = (ufsShow.length > 1 ? ufsShow.join(" E ") : nomeUf(ufsShow[0])).toUpperCase();
  const pts = ufsShow.flatMap((uf) => (ufs()[uf] || []).flat().map(mundo));
  const cam = enquadra(caixaDe(pts.length ? pts : story.shows.map((s) => mundo(s.lonlat))), RS, 2, 70);
  const estados = Object.entries(ufs()).map(([uf, polys]) => { const show = ufsShow.includes(uf);
    return `<path d="${caminho(polys.map((q) => q.map((v) => tela(cam, mundo(v)))))}" fill="${cor.sobreAcento}" fill-opacity="${show ? 0.92 : 0.16}" stroke="${cor.acento}" stroke-width="3"/>`; }).join("");
  const pos = story.shows.map((s) => tela(cam, mundo(s.lonlat))), desl = afastar(pos, 30, RS), N = story.shows.length;
  const marcas = story.shows.map((s, i) => {
    const x = pos[i][0] + desl[i][0], y = pos[i][1] + desl[i][1], k = p(T, 6.6 + i * 0.3, 0.35, pop);
    if (k <= 0) return "";
    if (N > 1) return `<g transform="translate(${x} ${y}) scale(${k.toFixed(3)}) translate(${-x} ${-y})"><circle cx="${x}" cy="${y}" r="26" fill="${cor.disco}" stroke="#ffffff" stroke-width="5"/><text x="${x}" y="${y + 10}" text-anchor="middle" font-family="${F_ARCHIVO}" font-size="28" fill="#ffffff">${i + 1}</text></g>`;
    const nome = s.cidade.toUpperCase(), w = larg(nome) + 36, dir = x + 44 + w < 1000, lx = dir ? x + 44 : x - 44 - w;
    return `<g transform="translate(${x} ${y}) scale(${k.toFixed(3)}) translate(${-x} ${-y})"><circle cx="${x}" cy="${y}" r="26" fill="${cor.disco}" stroke="#ffffff" stroke-width="5"/>
      ${N > 1 ? `<text x="${x}" y="${y + 10}" text-anchor="middle" font-family="${F_ARCHIVO}" font-size="28" fill="#ffffff">${i + 1}</text>` : `<circle cx="${x}" cy="${y}" r="8" fill="#ffffff"/>`}</g>
      <g opacity="${p(T, 6.75 + i * 0.3, 0.3, enter).toFixed(3)}"><rect x="${lx}" y="${y - 28}" width="${w}" height="56" rx="28" fill="${cor.disco}"/>
      <text x="${lx + 18}" y="${y + 11}" font-family="${F_ARCHIVO}" font-size="30" fill="#ffffff">${esc(nome)}</text></g>`;
  }).join("");
  const giro = lerp(-30, 0, p(T, 5.55, 0.9, move)), sc = lerp(0.82, 1, p(T, 5.55, 0.9, move));
  const selo = `<g transform="translate(540 1070) rotate(${giro.toFixed(2)}) scale(${sc.toFixed(4)}) translate(-540 -1070)">
    <circle cx="540" cy="1070" r="500" fill="${cor.disco}"/>${[0.9, 0.93, 0.96].map((k) => `<circle cx="540" cy="1070" r="${500 * k}" fill="none" stroke="#262422" stroke-width="2"/>`).join("")}
    <clipPath id="hm"><circle cx="540" cy="1070" r="430"/></clipPath><circle cx="540" cy="1070" r="430" fill="${cor.acento}"/>
    <g clip-path="url(#hm)">${estados}</g></g>`;
  return fundo(cor) + `<text x="60" y="300" font-family="${F_INTER_XB}" font-weight="800" font-size="28" letter-spacing="6" fill="${cor.tinta}">FAIXA 2 · O SHOW É EM</text>` +
    sobe(p(T, 5.6, 0.4, enter), { x: 60, y: 420, f: cabe(titulo, 960, 110), texto: titulo, fill: cor.tinta }) +
    selo + marcas + legenda(T, story, cor) + `<rect x="${lerp(1080, 0, p(T, 8.7, 0.3, move)).toFixed(1)}" y="0" width="1080" height="1920" fill="${cor.bg}"/>`;
}
const larg = (t) => t.length * 0.78 * 30;

// Com mais de 1 show: "1 NITERÓI  2 RIO DE JANEIRO" numa linha embaixo do título (no mapa só os números).
function legenda(T, story, cor) {
  if (story.shows.length < 2) return "";
  const txt = story.shows.map((s, i) => `${i + 1} ${s.cidade.toUpperCase()}`).join("   ");
  return `<text x="60" y="500" font-family="${F_ARCHIVO}" font-size="${cabe(txt, 960, 36).toFixed(1)}" fill="${cor.acento}" opacity="${p(T, 6.7, 0.4, enter).toFixed(3)}" xml:space="preserve">${esc(txt)}</text>`;
}
