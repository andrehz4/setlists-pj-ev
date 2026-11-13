// Layout J, cenas 1 (notificação sobre o clipe, 0 a 3), 2 (amigo manda o logo, 3 a 5.5) e 3 (localização, 5.5 a 9).
import { p, pop, enter, move, lerp } from "../../tempo.mjs";
import { ufs } from "../../../mapa.mjs";
import { mundo, caixaDe, enquadra, tela, caminho } from "../../mapa-comum.mjs";
import { nomeUf } from "../../../voz.mjs";
import { linhasDoNome } from "../G/placas.mjs";
import { balao, digitando, topo, fundo, entra, larg, esc, F_INTER_XB, F_INTER } from "./pecas.mjs";

const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const dataChat = (dia) => `${DIAS[new Date(`${dia}T12:00:00Z`).getUTCDay()]}, ${dia.slice(8)}/${dia.slice(5, 7)}`;

export function abertura(T, story, cor) {
  if (T >= 3) return "";
  const linhas = linhasDoNome(story.banda, 14), f = Math.min(170, ...linhas.map((l) => 860 / (l.length * 0.62)));
  const N = story.shows.length, h = 250 + linhas.length * f * 1.05 + 70;
  const k = p(T, 0.2, 0.5, pop), y = lerp(-h - 40, 300, k);
  const card = `<g opacity="${Math.min(1, k * 2).toFixed(3)}"><rect x="40" y="${y}" width="1000" height="${h}" rx="44" fill="${cor.topo}" opacity="0.96"/>
    <rect x="80" y="${y + 40}" width="64" height="64" rx="16" fill="${cor.acento}"/><text x="112" y="${y + 84}" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="30" fill="${cor.topo}">SM</text>
    <text x="164" y="${y + 84}" font-family="${F_INTER_XB}" font-weight="800" font-size="32" fill="${cor.apoio}">SÓ MAIS UM FÃ</text><text x="1000" y="${y + 84}" text-anchor="end" font-family="${F_INTER}" font-size="30" fill="${cor.apoio}">agora</text>
    <text x="80" y="${y + 180}" font-family="${F_INTER_XB}" font-weight="800" font-size="56" fill="${cor.acento}">Hoje tem</text>
    ${linhas.map((l, i) => `<text x="80" y="${(y + 190 + (i + 1) * f * 1.02).toFixed(1)}" font-family="${F_INTER_XB}" font-weight="800" font-size="${f.toFixed(1)}" fill="${cor.texto}">${esc(l)}</text>`).join("")}
    <text x="80" y="${(y + h - 50).toFixed(1)}" font-family="${F_INTER}" font-size="40" fill="${cor.apoio}">${esc(dataChat(story.dia))}${N > 1 ? ` · ${N} shows` : ""}</text></g>`;
  const k2 = p(T, 1.3, 0.4, pop), y2 = 300 + h + 30;
  const card2 = k2 > 0 ? `<g opacity="${Math.min(1, k2 * 2).toFixed(3)}" transform="translate(0 ${lerp(-60, 0, k2).toFixed(1)})"><rect x="40" y="${y2}" width="1000" height="150" rx="40" fill="${cor.topo}" opacity="0.92"/>
    <text x="80" y="${y2 + 62}" font-family="${F_INTER_XB}" font-weight="800" font-size="34" fill="${cor.texto}">Galera do show</text>
    <text x="80" y="${y2 + 112}" font-family="${F_INTER}" font-size="36" fill="${cor.apoio}">bora? quem vai levanta a mão</text></g>` : "";
  const veu = `<rect width="1080" height="1920" fill="#000" opacity="${(0.3 * p(T, 0, 0.3, enter)).toFixed(3)}"/>`;
  return veu + card + card2 + `<rect x="0" y="${lerp(1920, 0, p(T, 2.5, 0.45, move)).toFixed(1)}" width="1080" height="1920" fill="${cor.bg}"/>`;
}

export function cenaLogo(T, story, cor, logoUri) {
  if (T < 3 || T >= 5.5) return "";
  let y = 400, s = "";
  const foto = balao(T, { lado: "outro", y, at: 3.1, cor, w: 680, hMiolo: 640, autor: "Bia", miolo: (x, yy) => logoUri
    ? `<clipPath id="jl"><rect x="${x + 20}" y="${yy}" width="640" height="620" rx="24"/></clipPath><image href="${logoUri}" x="${x + 20}" y="${yy}" width="640" height="620" clip-path="url(#jl)" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect x="${x + 20}" y="${yy}" width="640" height="620" rx="24" fill="${cor.acento}"/>` });
  s += foto.svg; y += foto.h + 24;
  const t1 = story.desde ? `${story.conta}, na estrada desde ${story.desde}` : `${story.conta} toca hoje`;
  const b1 = balao(T, { lado: "outro", y, at: 3.6, cor, texto: t1 }); s += digitando(T, 3.3, 3.6, y, cor) + b1.svg; y += b1.h + 24;
  if (story.cidadeBase) { const b2 = balao(T, { lado: "outro", y, at: 3.95, cor, texto: `cidade da banda: ${story.cidadeBase}` }); s += b2.svg; y += b2.h + 24; }
  s += balao(T, { lado: "eu", y, at: 4.5, cor, texto: "bora!!", f: 72 }).svg;
  return fundo(cor) + topo(cor, "você, Bia e mais 12") + s;
}

export function cenaLocal(T, story, cor) {
  if (T < 5.5 || T >= 9) return "";
  const ufsShow = [...new Set(story.shows.map((s) => s.uf))], R = { x: 80, y: 520, w: 820, h: 720 };
  const pts = ufsShow.flatMap((uf) => (ufs()[uf] || []).flat().map(mundo));
  const cam = enquadra(caixaDe(pts), R, 2, 40);
  const estado = ufsShow.length > 1 ? ufsShow.join(" e ") : nomeUf(ufsShow[0]);
  const mapa = (x, y) => {
    const dx = x + 20 - R.x, dy = y - R.y;
    const est = Object.entries(ufs()).map(([uf, polys]) => `<path d="${caminho(polys.map((q) => q.map((v) => { const [a, b] = tela(cam, mundo(v)); return [a + dx, b + dy]; })))}" fill="${ufsShow.includes(uf) ? cor.acento : cor.apoio}" fill-opacity="${ufsShow.includes(uf) ? 0.9 : 0.18}" stroke="${cor.outro}" stroke-width="3"/>`).join("");
    const pinos = story.shows.map((s, i) => { const [a, b] = tela(cam, mundo(s.lonlat)), k = p(T, 6.6 + i * 0.3, 0.35, pop);
      const px = a + dx, py = b + dy;
      return k > 0 ? `<g transform="translate(${px} ${py}) scale(${k.toFixed(3)})"><path d="M0,0 C-34,-44 -34,-92 0,-92 C34,-92 34,-44 0,0 Z" fill="${cor.eu}" stroke="${cor.texto}" stroke-width="4"/><circle cx="0" cy="-62" r="13" fill="${cor.texto}"/></g>` : ""; }).join("");
    return `<clipPath id="jm"><rect x="${x + 20}" y="${y}" width="820" height="720" rx="24"/></clipPath><g clip-path="url(#jm)"><rect x="${x + 20}" y="${y}" width="820" height="720" fill="${cor.bg}"/>${est}${pinos}</g>`;
  };
  const cidades = story.shows.map((s) => s.cidade).join(", ");
  const card = balao(T, { lado: "outro", y: 400, at: 5.65, cor, w: 860, hMiolo: 740, autor: "Bia", miolo: mapa });
  const leg = entra(T, 5.9), yl = 400 + card.h + 20;
  const legenda = `<g opacity="${leg.toFixed(3)}"><text x="80" y="${yl + 40}" font-family="${F_INTER_XB}" font-weight="800" font-size="${Math.min(52, 900 / larg(`O show é em ${estado}`, 1)).toFixed(1)}" fill="${cor.texto}">${esc(`O show é em ${estado}`)}</text>
    <text x="80" y="${yl + 92}" font-family="${F_INTER}" font-size="${Math.min(38, 900 / larg(cidades, 1)).toFixed(1)}" fill="${cor.apoio}">${esc(cidades)}</text></g>`;
  const resp = balao(T, { lado: "eu", y: yl + 130, at: 7.6, cor, texto: `${ufsShow.length > 1 ? "pertinho" : estado}? partiu!`, f: 60 });
  return fundo(cor) + topo(cor, "Bia está digitando...") + card.svg + legenda + resp.svg +
    `<rect x="0" y="${lerp(1920, 0, p(T, 8.7, 0.3, move)).toFixed(1)}" width="1080" height="1920" fill="${cor.bg}"/>`;
}
