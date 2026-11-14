// Layout L, cenas 1 (fita entra no deck, PLAY aperta, etiqueta escrita: 0 a 3, sobre o clipe) e 2 (encarte da fita
// com o logo da banda: 3 a 5.5).
import { p, pop, enter, move, lerp } from "../../tempo.mjs";
import { fita, botoes, escreve, escrito, fundo, entra, dataCurta, esc, cabeI, F_MARKER, F_INTER, F_INTER_XB } from "./pecas.mjs";

export const angDe = (T) => (T < 1.4 ? 0 : (T - 1.4) * 230);

export function abertura(T, story, cor) {
  if (T >= 3) return "";
  const N = story.shows.length, k = p(T, 0.15, 0.55, pop), w = 960, y = lerp(1950, 560, k);
  const nome = escreve(story.banda, 780, 168, 96, 40);
  const yNome = 58 + (172 - nome.linhas.length * nome.f * 1.12) / 2 + nome.f * 0.95;
  const data = `${dataCurta(story.dia)}${N > 1 ? ` · ${N} shows` : ""}`;
  const cassete = fita({ x: 60, y, w, cor, ang: angDe(T), fluxo: T < 1.4 ? 0 : (T - 1.4) * 0.03,
    topo: (a) => escrito(T, 0.55, 0.32, nome.linhas, { x: a.x + a.w / 2, y: yNome, f: nome.f, fill: cor.tinta }),
    base: (a) => escrito(T, 1.25, 0.3, [data], { x: a.x + a.w / 2, y: a.y + 36, f: Math.min(38, 760 / (data.length * 0.62)), fill: cor.tinta }) });
  const kb = p(T, 0.75, 0.4, pop), yb = 560 + 605 + 70;
  const deck = kb > 0 ? `<g opacity="${Math.min(1, kb * 2).toFixed(3)}" transform="translate(0 ${lerp(80, 0, kb).toFixed(1)})">${botoes({ cx: 540, y: yb, w: 880, cor, apertado: T >= 1.4 ? "play" : null })}</g>` : "";
  const kt = p(T, 0.35, 0.4, enter);
  const chamada = `<g opacity="${kt.toFixed(3)}"><rect x="60" y="${(360 - (1 - kt) * 30).toFixed(1)}" width="420" height="120" rx="20" fill="${cor.acento}"/>
    <text x="270" y="${(442 - (1 - kt) * 30).toFixed(1)}" text-anchor="middle" font-family="${F_MARKER}" font-size="72" fill="${cor.sobreAcento}">Hoje tem</text></g>`;
  const veu = `<rect width="1080" height="1920" fill="#000" opacity="${(0.35 * p(T, 0, 0.3, enter)).toFixed(3)}"/>`;
  return veu + chamada + cassete + deck + `<rect x="0" y="${lerp(1920, 0, p(T, 2.5, 0.45, move)).toFixed(1)}" width="1080" height="1920" fill="${cor.bg}"/>`;
}

// Encarte (J-card) dentro da caixinha de acrílico: lombada com o nome, frente com o logo, verso com o resumo.
export function cenaLogo(T, story, cor, logoUri) {
  if (T < 3 || T >= 5.5) return "";
  const k = p(T, 3.05, 0.5, pop), dx = lerp(700, 0, k), rot = lerp(8, -2, k);
  const X = 150, Y = 330, W = 780, H = 1140, lomb = 90, fx = X + lomb;
  const logo = logoUri
    ? `<clipPath id="ll"><rect x="${fx + 40}" y="${Y + 40}" width="610" height="610" rx="8"/></clipPath><image href="${logoUri}" x="${fx + 40}" y="${Y + 40}" width="610" height="610" clip-path="url(#ll)" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect x="${fx + 40}" y="${Y + 40}" width="610" height="610" rx="8" fill="${cor.faixa}"/>
       <text x="${fx + 345}" y="${Y + 380}" text-anchor="middle" font-family="${F_MARKER}" font-size="120" fill="${cor.etiqueta}">MIXTAPE</text>`;
  const nome = escreve(story.banda, 600, 190, 96, 40);
  const yN = Y + 690 + nome.f;
  const lombada = Math.min(56, 1000 / (story.banda.length * 0.62));
  const desde = story.desde ? `na estrada desde ${story.desde}` : "toca hoje";
  const info = [`${story.conta}, ${desde}`, story.cidadeBase ? `cidade da banda: ${story.cidadeBase}` : null].filter(Boolean);
  const textos = info.map((t, i) => `<text x="${fx + 40}" y="${(Y + 960 + i * 62).toFixed(1)}" font-family="${i ? F_INTER : F_INTER_XB}" font-weight="${i ? 400 : 800}" font-size="${cabeI(t, 620, 40).toFixed(1)}" fill="${cor.tinta}" opacity="${entra(T, 3.9 + i * 0.2).toFixed(3)}">${esc(t)}</text>`).join("");
  const caixa = `<g transform="translate(${dx.toFixed(1)} 0) rotate(${rot.toFixed(2)} 540 900)">
    <rect x="${X - 24}" y="${Y - 24}" width="${W + 48}" height="${H + 48}" rx="26" fill="#ffffff" opacity="0.12" stroke="${cor.apoio}" stroke-width="4"/>
    <rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="${cor.papel}"/>
    <rect x="${X}" y="${Y}" width="${lomb}" height="${H}" fill="${cor.faixa}"/>
    <text transform="translate(${X + lomb / 2 + lombada * 0.36} ${Y + H / 2}) rotate(-90)" text-anchor="middle" font-family="${F_MARKER}" font-size="${lombada.toFixed(1)}" fill="${cor.etiqueta}">${esc(story.banda)}</text>
    ${logo}
    ${escrito(T, 3.45, 0.28, nome.linhas, { x: fx + 40, y: yN, f: nome.f, fill: cor.tinta, ancora: "start" })}
    <rect x="${fx + 40}" y="${Y + 905}" width="610" height="4" fill="${cor.tinta}" opacity="0.25"/>${textos}
    <path d="M${X - 24},${Y + 260} L${X + 220},${Y - 24} L${X + 330},${Y - 24} L${X - 24},${Y + 380} Z" fill="#ffffff" opacity="0.10"/></g>`;
  const legenda = `<text x="540" y="1590" text-anchor="middle" font-family="${F_MARKER}" font-size="54" fill="${cor.texto}" opacity="${entra(T, 4.4).toFixed(3)}">aperta o play</text>`;
  return fundo(cor) + caixa + legenda;
}

