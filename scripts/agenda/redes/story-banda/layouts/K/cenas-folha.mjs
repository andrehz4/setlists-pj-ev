// Layout K, cenas 1 (folha do setlist cai sobre o clipe, 0 a 3), 2 (logo colado na folha, 3 a 5.5) e
// 3 (mapinha desenhado com o X no show, 5.5 a 9).
import { p, pop, enter, move, lerp } from "../../tempo.mjs";
import { ufs } from "../../../mapa.mjs";
import { mundo, caixaDe, enquadra, tela, caminho } from "../../mapa-comum.mjs";
import { nomeUf } from "../../../voz.mjs";
import { linhasDoNome } from "../G/placas.mjs";
import { palco, folha, fita, escreve, circulo, xis, cabe, esc, F_MARKER, F_INTER_XB } from "./pecas.mjs";

const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const dataCurta = (dia) => `${DIAS[new Date(`${dia}T12:00:00Z`).getUTCDay()]}, ${dia.slice(8)}/${dia.slice(5, 7)}`;
const cabecalho = (cor, dir) => `<text x="60" y="96" font-family="${F_INTER_XB}" font-weight="800" font-size="34" letter-spacing="10" fill="${cor.tinta}" opacity="0.55">SETLIST</text>
  <text x="840" y="96" text-anchor="end" font-family="${F_INTER_XB}" font-weight="800" font-size="30" fill="${cor.tinta}" opacity="0.55">${esc(dir)}</text>`;

export function abertura(T, story, cor) {
  if (T >= 3) return "";
  const linhas = linhasDoNome(story.banda, 12), f = Math.min(150, ...linhas.map((l) => cabe(l, 720, 150)));
  const N = story.shows.length, h = 220 + linhas.length * f * 1.08 + 170;
  const nome = linhas.map((l, i) => escreve(T, 0.55 + i * 0.3, { x: 60, y: 160 + (i + 1) * f * 1.05, t: l, f, cor: cor.tinta, rot: -1 })).join("");
  const sub = N > 1 ? `${N} shows hoje` : "hoje tem show";
  const conteudo = cabecalho(cor, dataCurta(story.dia)) + nome +
    escreve(T, 1.4, { x: 60, y: h - 70, t: sub, f: 64, cor: cor.acento, rot: -2 });
  const veu = `<rect width="1080" height="1920" fill="#000" opacity="${(0.35 * p(T, 0, 0.3, enter)).toFixed(3)}"/>`;
  return veu + folha({ x: 100, y: 380, w: 880, h, rot: -2.5, cor, k: p(T, 0.15, 0.45, pop) }, conteudo) +
    `<rect x="0" y="${lerp(1920, 0, p(T, 2.5, 0.45, move)).toFixed(1)}" width="1080" height="1920" fill="${cor.palco}"/>`;
}

export function cenaLogo(T, story, cor, logoUri) {
  if (T < 3 || T >= 5.5) return "";
  const kf = p(T, 3.25, 0.3, pop), s = lerp(1.35, 1, kf), cx = 420, cy = 450;
  const iniciais = story.banda.length <= 6 ? story.banda.toUpperCase() : story.banda.split(/\s+/).map((w) => w[0]).join("").slice(0, 3).toUpperCase();
  const img = logoUri
    ? `<clipPath id="klg"><rect x="${cx - 300}" y="${cy - 300}" width="600" height="600"/></clipPath><image href="${logoUri}" x="${cx - 300}" y="${cy - 300}" width="600" height="600" clip-path="url(#klg)" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect x="${cx - 300}" y="${cy - 300}" width="600" height="600" fill="${cor.acento}"/><text x="${cx}" y="${cy + 70}" text-anchor="middle" font-family="${F_MARKER}" font-size="${cabe(iniciais, 480, 220).toFixed(1)}" fill="${cor.papel}">${esc(iniciais)}</text>`;
  const foto = kf > 0 ? `<g opacity="${Math.min(1, kf * 2).toFixed(3)}" transform="translate(${cx} ${cy}) rotate(-4) scale(${s.toFixed(4)}) translate(${-cx} ${-cy})">
    <rect x="${cx - 316}" y="${cy - 300}" width="660" height="740" fill="#000" opacity="0.3"/><rect x="${cx - 330}" y="${cy - 330}" width="660" height="740" fill="#fbfbf7"/>${img}
    ${fita(cx - 110, cy - 370, 220, -4, cor)}</g>` : "";
  const t1 = story.conta || story.banda;
  const t2 = story.desde ? `na estrada desde ${story.desde}` : "toca hoje";
  const conteudo = cabecalho(cor, "abre a noite") + foto +
    escreve(T, 3.75, { x: 60, y: 940, t: t1, f: cabe(t1, 760, 100), cor: cor.acento, rot: -1.5 }) +
    escreve(T, 4.15, { x: 60, y: 1050, t: t2, f: cabe(t2, 760, 72), cor: cor.tinta, rot: -1 }) +
    (story.cidadeBase ? escreve(T, 4.55, { x: 60, y: 1140, t: `base: ${story.cidadeBase}`, f: cabe(`base: ${story.cidadeBase}`, 760, 58), cor: cor.tinta, rot: -1, op: 0.75 }) : "");
  return palco(T, cor) + folha({ x: 90, y: 330, w: 900, h: 1230, rot: 1.5, cor, k: p(T, 3.0, 0.3, enter) }, conteudo);
}

export function cenaEstado(T, story, cor) {
  if (T < 5.5 || T >= 9) return "";
  const ufsShow = [...new Set(story.shows.map((s) => s.uf))], R = { x: 70, y: 150, w: 760, h: 700 };
  const pts = ufsShow.flatMap((uf) => (ufs()[uf] || []).flat().map(mundo));
  const cam = enquadra(caixaDe(pts), R, 2, 50);
  const km = p(T, 5.6, 0.5, enter);
  const est = Object.entries(ufs()).map(([uf, polys]) => {
    const meu = ufsShow.includes(uf), d = caminho(polys.map((q) => q.map((v) => tela(cam, mundo(v)))));
    return `<path d="${d}" fill="${meu ? cor.acento : "none"}" fill-opacity="${meu ? 0.18 : 0}" stroke="${cor.tinta}" stroke-opacity="${meu ? 0.9 : 0.25}" stroke-width="${meu ? 5 : 2.5}" stroke-linejoin="round"/>`;
  }).join("");
  const marcas = story.shows.map((s, i) => {
    const [x, y] = tela(cam, mundo(s.lonlat));
    return xis(T, 6.5 + i * 0.3, { x, y, s: 24, cor: cor.acento }) + circulo(T, 6.8 + i * 0.3, { cx: x, cy: y, rx: 58, ry: 50, cor: cor.acento, w: 6 });
  }).join("");
  const mapa = `<clipPath id="kmp"><rect x="${R.x}" y="${R.y}" width="${R.w}" height="${R.h}"/></clipPath>
    <g clip-path="url(#kmp)" opacity="${km.toFixed(3)}">${est}</g>${marcas}`;
  const estado = ufsShow.length > 1 ? ufsShow.join(" e ") : nomeUf(ufsShow[0]);
  const cidades = story.shows.map((s) => s.cidade).join(", ");
  const conteudo = cabecalho(cor, "onde?") + mapa +
    escreve(T, 6.9, { x: 60, y: 960, t: "o show é em", f: 62, cor: cor.tinta, rot: -1 }) +
    escreve(T, 7.2, { x: 60, y: 1090, t: estado, f: cabe(estado, 760, 130), cor: cor.acento, rot: -2 }) +
    escreve(T, 7.7, { x: 60, y: 1180, t: cidades, f: cabe(cidades, 760, 56), cor: cor.tinta, rot: -1, op: 0.75 });
  return palco(T, cor) + folha({ x: 90, y: 330, w: 900, h: 1230, rot: -1.2, cor, k: p(T, 5.5, 0.3, enter), sai: p(T, 8.7, 0.3, move) }, conteudo);
}

