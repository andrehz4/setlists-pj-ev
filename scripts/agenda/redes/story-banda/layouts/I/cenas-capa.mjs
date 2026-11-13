// Layout I, cenas 1 (primeira página girando sobre o clipe, 0 a 3) e 2 (perfil com a foto em retícula, 3 a 5.5).
import { p, pop, enter, move, lerp } from "../../tempo.mjs";
import { linhasDoNome } from "../G/placas.mjs";
import { padroes, colunas, secao, cortina, fio, dataJornal, cabeAnton, esc, F_ANTON, F_INTER_XB, F_PLAYFAIR, F_SERIF } from "./pecas.mjs";

export const fundo = (cor) => `<rect width="1080" height="1920" fill="${cor.bg}"/>${padroes(cor)}`;
const cabecalho = (story, cor, y = 0) => `<text x="540" y="${y + 120}" text-anchor="middle" font-family="${F_PLAYFAIR}" font-style="italic" font-weight="900" font-size="96" fill="${cor.tinta}">Só Mais um Fã</text>
  ${fio(60, y + 150, 960, cor, 6)}<text x="60" y="${y + 186}" font-family="${F_INTER_XB}" font-weight="800" font-size="22" letter-spacing="2" fill="${cor.tinta}">${esc(dataJornal(story.dia))}</text>
  <text x="1020" y="${y + 186}" text-anchor="end" font-family="${F_INTER_XB}" font-weight="800" font-size="22" letter-spacing="2" fill="${cor.acento}">EDIÇÃO EXTRA</text>${fio(60, y + 202, 960, cor, 2)}`;

// a página inteira (1080x1920), usada girando na abertura
function pagina(story, cor) {
  const linhas = linhasDoNome(story.banda, 12), f = Math.min(...linhas.map((l) => cabeAnton(l, 960, 300)));
  let y = 420;
  const nome = linhas.map((l) => { const t = `<text x="60" y="${(y + f * 0.86).toFixed(1)}" font-family="${F_ANTON}" font-size="${f.toFixed(1)}" fill="${cor.tinta}">${esc(l)}</text>`; y += f * 0.98; return t; }).join("");
  const s = story.shows[0], N = story.shows.length;
  const sub = N > 1 ? `A banda faz ${N} shows hoje, começando em ${s.cidade}` : `A banda sobe ao palco hoje em ${s.cidade}`;
  return `<rect width="1080" height="1920" fill="${cor.bg}"/>${padroes(cor)}<g transform="translate(0 60)">${cabecalho(story, cor, 0)}</g>
    ${secao("HOJE TEM", 60, 300, cor)}${nome}
    <text x="60" y="${(y + 70).toFixed(1)}" font-family="${F_SERIF}" font-style="italic" font-size="58" fill="${cor.tinta}">${esc(sub)}</text>
    ${fio(60, y + 110, 960, cor, 2)}${colunas({ x: 60, y: y + 140, w: 960, h: 1660 - y - 140, n: 3, cor })}`;
}

export function abertura(T, story, cor) {
  if (T >= 3) return "";
  // gira e cresce (0.2 a 1.3), segura, e em 2.5 cresce até ocupar a tela
  const k = p(T, 0.2, 1.1, enter), z = p(T, 2.5, 0.45, move);
  const ang = lerp(720, -4, k) * (1 - z), s = lerp(0.04, 0.8, k) + 0.2 * z, ty = lerp(0, 0, z);
  if (k <= 0) return "";
  return `<g transform="translate(540 ${960 + ty}) rotate(${ang.toFixed(2)}) scale(${s.toFixed(4)}) translate(-540 -960)">
    <rect x="18" y="24" width="1080" height="1920" fill="#000" opacity="${(0.35 * (1 - z)).toFixed(2)}"/>${pagina(story, cor)}</g>`;
}

export function cenaPerfil(T, story, cor, logoUri) {
  if (T < 3 || T >= 5.5) return "";
  const qd = p(T, 3.1, 0.5, pop), rot = lerp(-8, -2, p(T, 3.1, 0.6, move));
  const foto = `<g opacity="${Math.min(1, qd * 2).toFixed(3)}" transform="translate(540 760) rotate(${rot.toFixed(2)}) scale(${lerp(1.25, 1, qd).toFixed(4)}) translate(-540 -760)">
    <rect x="200" y="420" width="680" height="680" fill="#fff"/>${logoUri ? `<image href="${logoUri}" x="220" y="440" width="640" height="640" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect x="220" y="440" width="640" height="640" fill="${cor.tinta}"/>`}<rect x="220" y="440" width="640" height="640" fill="url(#ret)" opacity="0.18"/></g>`;
  const legenda = `<text x="200" y="1150" font-family="${F_SERIF}" font-style="italic" font-size="38" fill="${cor.tinta}" opacity="${p(T, 3.5, 0.3, enter).toFixed(3)}">Foto: divulgação ${esc(story.conta)}</text>`;
  const frase = story.desde ? `Na estrada desde ${story.desde},` : "Uma das bandas da cena,";
  const de = story.cidadeBase ? `vem de ${story.cidadeBase}.` : `toca hoje.`;
  return fundo(cor) + secao("PERFIL", 60, 260, cor) + foto + legenda +
    cortina(p(T, 3.7, 0.5, move), 1190, 240, `<text x="60" y="1270" font-family="${F_SERIF}" font-size="70" fill="${cor.tinta}">${esc(frase)}</text>
      <text x="60" y="1350" font-family="${F_SERIF}" font-size="70" fill="${cor.tinta}">${esc(de)}</text>`) +
    cortina(p(T, 4.0, 0.4, move), 1390, 120, `<text x="60" y="1460" font-family="${F_ANTON}" font-size="${cabeAnton(story.conta, 960, 80).toFixed(1)}" fill="${cor.acento}">${esc(story.conta.toUpperCase())}</text>`);
}
