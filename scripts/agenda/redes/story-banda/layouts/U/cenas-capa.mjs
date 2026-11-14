// Layout U, cenas 1 (meia folha de ofício sobe por cima do clipe, "HOJE TEM" e o nome batidos letra a letra, carimbo
// cai, 0 a 3) e 2 (ficha de identificação com o logo grampeado como anexo, carimbo de protocolo e campos datilografados,
// 3 a 5.5).
import { p, pop } from "../../tempo.mjs";
import { linhasDoNome } from "../G/placas.mjs";
import { maquina, rotulo, folha, cabecalho, autoN, cabeMaq, batidas, novoId, f1, rnd, FL, MX, MW, F_ANTON, esc, corpoQueCabe } from "./pecas.mjs";
import { galhos, varre, fundo } from "./fundo.mjs";
import { carimbo, grampo } from "./objetos.mjs";

const DIAS = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
export const dataLonga = (dia) => `${DIAS[new Date(`${dia}T12:00:00Z`).getUTCDay()]}, ${dia.slice(8)}/${dia.slice(5, 7)}/${dia.slice(0, 4)}`;
// protocolo fixo por banda e dia (soma simples dos códigos das letras)
export const protocolo = (story) => `${story.dia.replace(/-/g, ".")}-${String([...String(story.banda)].reduce((s, c) => s + c.codePointAt(0), 0) % 10000).padStart(4, "0")}`;
export const F_MAO = "'Instrument Serif','Playfair Display',Georgia,serif";
export const caneta = (x, y, t, f, cor, op = 1, anchor = "start") =>
  `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" font-family="${F_MAO}" font-style="italic" font-size="${f1(f)}" fill="${cor.caneta}" opacity="${op.toFixed(3)}">${esc(t)}</text>`;

export function abertura(T, story, cor) {
  if (T >= 3) return "";
  const linhas = linhasDoNome(story.banda, 12), N = story.shows.length, larg = 720;
  const f = Math.min(...linhas.map((l) => cabeMaq(l, larg, 112))), lh = f * 1.12;
  const x = 80, w = 920, h = 300 + linhas.length * lh, y = 1720 - h, tx = x + 120;
  const total = linhas.join("").length, passo = Math.min(0.06, 1.0 / total), t0 = 0.95;
  const data = `${dataLonga(story.dia)}${N > 1 ? ` · ${N} SHOWS` : ""}`, fd = cabeMaq(data, larg, 36);
  let antes = 0;
  const nome = linhas.map((l, i) => {
    const n = batidas(T, t0 + antes * passo, passo), s = maquina(tx, y + 230 + (i + 0.8) * lh, l, f, cor, { n, seed: 40 + i, cursor: n > 0 && n < l.length });
    antes += l.length;
    return s;
  }).join("");
  const miolo = () => maquina(tx, y + 92, autoN(story.dia), 26, cor, { n: batidas(T, 0.3, 0.02), seed: 3 }) +
    `<path d="M${tx},${y + 114} H${x + w - 60} M${tx},${y + 120} H${x + w - 60}" stroke="${cor.tinta}" stroke-width="1.2" opacity="0.5"/>` +
    maquina(tx, y + 200, "HOJE TEM", 52, cor, { n: batidas(T, 0.5, 0.05), seed: 7, cursor: T < 0.95 }) + nome +
    maquina(tx, y + 230 + linhas.length * lh + 50, data, fd, cor, { n: batidas(T, 2.0, 0.012), seed: 9 }) +
    carimbo(T, { cx: x + w - 190, cy: y + 96, w: 280, linhas: ["AO VIVO"], at: 2.2, rot: -9, cor, fMax: 64, seed: 2 });
  return galhos(T, cor, { quais: [2], op: 0.85 }) + folha(T, { x, y, w, h, rot: -1.6, at: 0.05, cor, seed: 4, furos: false, miolo }) + varre(T, 2.55, cor);
}

export function cenaLogo(T, story, cor, logoUri) {
  if (T < 3 || T >= 5.5) return "";
  const lado = 440, fx = 540 - lado / 2, fy = FL.y + 230, kf = p(T, 3.5, 0.4, pop);
  const cl = novoId("ul"), conta = story.conta || story.banda;
  const reserva = () => { const ln = linhasDoNome(story.banda, 10), fr = Math.min(...ln.map((l) => corpoQueCabe(l, lado - 70, 110, "anton", 2)));
    return `<rect x="${fx}" y="${fy}" width="${lado}" height="${lado}" fill="${cor.tinta}"/>` + ln.map((l, i) =>
      `<text x="540" y="${f1(fy + lado / 2 + (i - (ln.length - 1) / 2) * fr * 1.08 + fr * 0.36)}" text-anchor="middle" font-family="${F_ANTON}" font-size="${f1(fr)}" letter-spacing="2" fill="${cor.papel}">${esc(l)}</text>`).join(""); };
  const img = logoUri ? `<clipPath id="${cl}"><rect x="${fx}" y="${fy}" width="${lado}" height="${lado}"/></clipPath>
    <image href="${logoUri}" x="${fx}" y="${fy}" width="${lado}" height="${lado}" clip-path="url(#${cl})" preserveAspectRatio="xMidYMid slice"/>
    <rect x="${fx}" y="${fy}" width="${lado}" height="${lado}" fill="${cor.mancha}" opacity="0.1"/>` : reserva();
  // foto do anexo: cai sobre a ficha e leva dois grampos em cima
  const foto = kf > 0 ? `<g opacity="${Math.min(1, kf * 3).toFixed(3)}" transform="rotate(2.2 540 ${fy + lado / 2}) translate(0 ${f1((1 - Math.min(1, kf)) * -60)})">
    <rect x="${fx - 10}" y="${fy - 4}" width="${lado + 40}" height="${lado + 40}" fill="#000" opacity="0.25"/>
    <rect x="${fx - 18}" y="${fy - 18}" width="${lado + 36}" height="${lado + 36}" fill="${cor.foto}" stroke="${cor.tinta}" stroke-opacity="0.2"/>${img}
    ${p(T, 3.85, 0.05) > 0 ? grampo(fx + 70, fy - 14, -7, cor) + grampo(fx + lado - 70, fy - 14, 5, cor) : ""}</g>` : "";
  const campos = [["CONTA", conta], ["NA ESTRADA DESDE", story.desde ? String(story.desde) : ""], ["BASE", story.cidadeBase || ""]].filter(([, v]) => v);
  const y0 = fy + lado + 130;
  const fichas = campos.map(([r, v], i) => {
    const yy = y0 + i * 118, fv = cabeMaq(v, MW, 46);
    return rotulo(MX, yy, r, 21, cor.tinta) + `<path d="M${MX},${yy + 70} H${MX + MW}" stroke="${cor.tinta}" stroke-width="1.3" stroke-dasharray="2 5" opacity="0.6"/>` +
      maquina(MX, yy + 60, v, fv, cor, { n: batidas(T, 3.95 + i * 0.32, 0.022), seed: 60 + i });
  }).join("");
  const yo = y0 + campos.length * 118 + 40, kn = p(T, 4.7, 0.5);
  const obs = yo + 90 < FL.y + FL.h - 40 ? rotulo(MX, yo, "OBSERVAÇÕES", 21, cor.tinta) + caneta(MX + 10, yo + 70, "ver ao vivo, hoje!", 58, cor, kn) +
    `<path d="M${MX + 10},${yo + 86} q160,12 ${f1(380 * kn)},-4" fill="none" stroke="${cor.caneta}" stroke-width="2.6" stroke-linecap="round"/>` : "";
  const miolo = () => cabecalho(cor, "FICHA DE IDENTIFICAÇÃO", autoN(story.dia)) +
    maquina(MX, FL.y + 165, "ANEXO I: LOGO DA BANDA", 32, cor, { n: batidas(T, 3.35, 0.02), seed: 21 }) + foto +
    carimbo(T, { cx: fx + lado - 30, cy: fy + lado + 20, w: 330, linhas: ["PROTOCOLO", protocolo(story)], at: 4.05, rot: -8, cor, fMax: 54, seed: 6 }) + fichas + obs;
  return fundo(T, cor) + folha(T, { rot: -0.8, at: 3.0, cor, seed: 8 + Math.floor(rnd(1) * 3), miolo });
}
