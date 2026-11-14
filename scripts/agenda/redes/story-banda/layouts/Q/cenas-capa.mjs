// Layout Q, cenas 1 (capa de tecido com o título gravado em dourado sobe por cima do clipe, 0 a 3) e 2 (a página
// vira e o logo aparece como "Fig. 1", colado com cantoneiras, com nota de pena na margem, 3 a 5.5).
import { p, pop, enter, lerp } from "../../tempo.mjs";
import { linhasDoNome } from "../G/placas.mjs";
import { tecido, pagina, moldura, filete, cantoneira, viraFolha, varre, serif, cabe, novoId, f1, PG } from "./pecas.mjs";
import { coracao } from "./desenhos.mjs";

const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
export const edicao = (dia) => `Edição de ${DIAS[new Date(`${dia}T12:00:00Z`).getUTCDay()]}, ${dia.slice(8)}/${dia.slice(5, 7)}`;

// dourado em relevo: degradê de folha de ouro (escuro, ouro, brilho, ouro, escuro)
export const ouro = (cor) => {
  const id = novoId("qo");
  return { id, def: `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${cor.ouroEsc}"/><stop offset="0.35" stop-color="${cor.ouro}"/><stop offset="0.5" stop-color="${cor.ouroClaro}"/><stop offset="0.65" stop-color="${cor.ouro}"/><stop offset="1" stop-color="${cor.ouroEsc}"/></linearGradient>` };
};

export function abertura(T, story, cor) {
  if (T >= 3) return "";
  const linhas = linhasDoNome(story.banda, 9), f = Math.min(...linhas.map((l) => cabe(l, 660, 160, 0.62)));
  const N = story.shows.length, x = 120, y = 300, w = 840, h = 300 + linhas.length * f * 1.08 + 330;
  const k = p(T, 0.1, 0.6, enter), dy = lerp(1500, 0, k), rot = lerp(4, 0, k);
  const g = ouro(cor), cl = novoId("qc"), brilho = novoId("qb"), sb = lerp(-500, 1300, p(T, 1.0, 0.9, enter));
  const yNome = y + 250, yFim = yNome + linhas.length * f * 1.08;
  const conteudo = serif(540, y + 150, "HOJE TEM", 46, `url(#${g.id})`, { peso: "bold", ls: 10 }) + filete(540, y + 196, 420, `url(#${g.id})`) +
    linhas.map((l, i) => serif(540, yNome + (i + 0.82) * f * 1.08, l, f, `url(#${g.id})`, { peso: "black", ls: 1 })).join("") +
    filete(540, yFim + 44, 420, `url(#${g.id})`) + coracao(540, yFim + 150, 0.42, `url(#${g.id})`) +
    serif(540, yFim + 268, edicao(story.dia), 44, `url(#${g.id})`, { peso: "bold" }) +
    (N > 1 ? serif(540, yFim + 318, `com ${N} shows`, 34, `url(#${g.id})`, { op: 0.9 }) : "");
  const capa = `<g transform="translate(0 ${f1(dy)}) rotate(${f1(rot)} 540 ${y + h})">${g.def}
    <rect x="${x + 16}" y="${y + 22}" width="${w}" height="${h}" rx="10" fill="#000" opacity="0.45"/>
    <clipPath id="${cl}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/></clipPath>
    <g clip-path="url(#${cl})">${tecido(cor)}<rect x="${x}" y="${y}" width="34" height="${h}" fill="#000" opacity="0.18"/>
      ${moldura(x + 40, y + 40, w - 80, h - 80, `url(#${g.id})`, 1, 1.3)}${conteudo}
      <linearGradient id="${brilho}" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <rect x="${f1(sb)}" y="${y - 200}" width="260" height="${h + 400}" fill="url(#${brilho})" transform="rotate(18 ${f1(sb + 130)} ${y + h / 2})"/></g></g>`;
  const veu = `<rect width="1080" height="1920" fill="#000" opacity="${(0.42 * p(T, 0, 0.3, enter)).toFixed(3)}"/>`;
  return veu + capa + varre(T, 2.5, cor);
}

export function cenaLogo(T, story, cor, logoUri) {
  if (T < 3 || T >= 5.5) return "";
  const conta = story.conta || story.banda, lado = 560, fx = 540 - lado / 2, fy = 440;
  const kf = p(T, 3.25, 0.5, pop), cl = novoId("ql");
  const img = logoUri
    ? `<clipPath id="${cl}"><rect x="${fx}" y="${fy}" width="${lado}" height="${lado}"/></clipPath><image href="${logoUri}" x="${fx}" y="${fy}" width="${lado}" height="${lado}" clip-path="url(#${cl})" preserveAspectRatio="xMidYMid slice"/>
       <rect x="${fx}" y="${fy}" width="${lado}" height="${lado}" fill="${cor.mancha}" opacity="0.12"/>`
    : `<rect x="${fx}" y="${fy}" width="${lado}" height="${lado}" fill="${cor.tinta}"/>${serif(540, fy + lado / 2 + 40, story.banda, cabe(story.banda, lado - 80, 120, 0.62), cor.papel, { peso: "black" })}`;
  const foto = kf > 0 ? `<g opacity="${Math.min(1, kf * 2).toFixed(3)}" transform="rotate(${f1(lerp(-8, -2, kf))} 540 ${fy + lado / 2}) translate(0 ${f1((1 - kf) * 40)})">
    <rect x="${fx - 20}" y="${fy - 20}" width="${lado + 40}" height="${lado + 40}" fill="${cor.papel}" stroke="${cor.tinta}" stroke-width="1" opacity="0.95"/>${img}
    ${cantoneira(fx - 28, fy - 28, 1, 1, cor)}${cantoneira(fx + lado + 28, fy - 28, -1, 1, cor)}${cantoneira(fx - 28, fy + lado + 28, 1, -1, cor)}${cantoneira(fx + lado + 28, fy + lado + 28, -1, -1, cor)}</g>` : "";
  const kt = p(T, 3.6, 0.4, enter), yt = fy + lado + 120;
  const linhas = [story.desde ? `Na estrada desde ${story.desde}.` : "", story.cidadeBase ? `base: ${story.cidadeBase}` : ""].filter(Boolean);
  const texto = `<g opacity="${kt.toFixed(3)}">${serif(540, yt, `Fig. 1. ${conta}`, cabe(`Fig. 1. ${conta}`, 780, 64, 0.5), cor.tinta, { peso: "bold" })}
    ${linhas.map((l, i) => serif(540, yt + 70 + i * 56, l, cabe(l, 760, 44, 0.48), cor.tinta, { op: 0.85 })).join("")}</g>`;
  const kn = p(T, 4.2, 0.6, enter), xn = 120, yn = yt + 70 + linhas.length * 56 + 120;
  const nota = `<g transform="rotate(-6 ${xn} ${yn})" opacity="${Math.min(1, kn * 1.5).toFixed(3)}">${serif(xn + 40, yn, "ver ao vivo, hoje!", 64, cor.acento, { anchor: "start", peso: "instr" })}
    <path d="M${xn + 40},${yn + 18} q180,${f1(14 * kn)} ${f1(420 * kn)},0" fill="none" stroke="${cor.acento}" stroke-width="3" stroke-linecap="round"/></g>`;
  return tecido(cor) + pagina(cor, 7) + serif(540, PG.y + 120, "CAPÍTULO I", 36, cor.tinta, { peso: "bold", ls: 9 }) + filete(540, PG.y + 156, 380, cor.tinta, 0.85) +
    foto + texto + nota + coracao(850, yn + 30, 0.72, cor.tinta, p(T, 4.0, 1.2, enter)) + viraFolha(T, 3.0, cor);
}
