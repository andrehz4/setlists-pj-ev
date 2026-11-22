// Telas (SVG 1080x1920) do reel "Agenda da semana": abertura sobre o Pearl Jam, mapa acendendo, um dia por cena, fecho.
import fs from "node:fs";
import { naRaiz } from "../../scripts/config.mjs";
import { F_ANTON, F_INTER_SB, F_INTER_XB, F_PLAYFAIR } from "../../scripts/publish/fontconfig-boot.mjs";
import { escapeXml as esc } from "../../scripts/publish/slide/base.mjs";
import { cidadesDoDia, projecao, caminhosUf, ufs, centroUf } from "../../scripts/agenda/redes/mapa.mjs";
import { horaCurta } from "../../scripts/agenda/redes/regiao.mjs";

export const W = 1080, H = 1920;
export const COR = { fundo: "#14110F", amarelo: "#FFCC1A", vermelho: "#E10600", claro: "#FFFFFF" };
const DIAS = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
export const nomeDia = (d) => DIAS[new Date(`${d}T12:00:00Z`).getUTCDay()];
const b64 = (f) => `data:image/jpeg;base64,${fs.readFileSync(f).toString("base64")}`;
export const fotoBanda = (banda) => {
  const f = naRaiz(`media/agenda/fotos/${banda}.jpg`);
  return fs.existsSync(f) ? f : null;
};
const svg = (corpo, fundo = "") => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${fundo}${corpo}</svg>`;
const marca = `<text x="${W / 2}" y="130" text-anchor="middle" font-family="${F_PLAYFAIR}" font-style="italic" font-size="40" fill="#fff">Só Mais um Fã de PEARL JAM</text>`;
export const casaDe = (s) => (s.casaNome || (s.casa ? `@${s.casa}` : "casa a confirmar"));

// Abertura: texto por cima dos cortes da banda (fundo transparente, só um degradê pra ler).
export const abertura = () => svg(`<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#000" stop-opacity=".1"/><stop offset=".55" stop-color="#000" stop-opacity=".75"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>${marca}
  <text x="70" y="1150" font-family="${F_ANTON}" font-size="150" fill="#fff">ONDE TEM</text>
  <text x="70" y="1310" font-family="${F_ANTON}" font-size="150" fill="${COR.amarelo}">PEARL JAM</text>
  <text x="70" y="1470" font-family="${F_ANTON}" font-size="150" fill="#fff">AO VIVO</text>
  <rect x="70" y="1520" width="720" height="120" fill="${COR.amarelo}"/>
  <text x="100" y="1615" font-family="${F_ANTON}" font-size="96" fill="${COR.fundo}">ESSA SEMANA?</text>`);

// Mapa da semana com os primeiros `k` pinos acesos (cidades de oeste pra leste).
const MAPA = { x: 40, y: 520, w: 1000, h: 980 };
export function mapa(shows, k, periodo) {
  const cidades = cidadesDoDia(shows);
  const proj = projecao(cidades.map((c) => c.pos), { ...MAPA, folga: 1.6 });
  const acesas = cidades.slice(0, k), ufsAcesas = new Set(acesas.map((c) => c.uf));
  const estados = caminhosUf(proj).map((c) => `<path d="${c.d}" fill="${ufsAcesas.has(c.uf) ? COR.amarelo : "#ede4cc"}" fill-opacity="${ufsAcesas.has(c.uf) ? 0.5 : 0.12}" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>`).join("");
  const siglas = Object.keys(ufs()).map((uf) => {
    const [x, y] = proj(centroUf(uf));
    return x > MAPA.x + 40 && x < MAPA.x + MAPA.w - 40 && y > MAPA.y + 40 && y < MAPA.y + MAPA.h - 30
      ? `<text x="${x}" y="${y}" text-anchor="middle" font-family="${F_ANTON}" font-size="44" fill="#fff" opacity="${ufsAcesas.has(uf) ? 0.8 : 0.3}">${uf}</text>` : "";
  }).join("");
  const pinos = acesas.map((c) => {
    const [x, y] = proj(c.pos);
    return `<circle cx="${x}" cy="${y}" r="20" fill="${COR.vermelho}" stroke="#fff" stroke-width="5"/>`;
  }).join("");
  const n = shows.length, nc = cidades.length;
  return svg(`${marca}
  <text x="70" y="330" font-family="${F_ANTON}" font-size="150" fill="#fff">${n} SHOWS</text>
  <rect x="70" y="370" width="${W - 140}" height="90" fill="${COR.amarelo}"/>
  <text x="${W / 2}" y="433" text-anchor="middle" font-family="${F_INTER_XB}" font-size="44" fill="${COR.fundo}">EM ${nc} CIDADES · ${esc(periodo)}</text>
  <clipPath id="q"><rect x="${MAPA.x}" y="${MAPA.y}" width="${MAPA.w}" height="${MAPA.h}"/></clipPath>
  <g clip-path="url(#q)">${estados}${siglas}${pinos}</g>
  <text x="${W / 2}" y="1640" text-anchor="middle" font-family="${F_INTER_SB}" font-size="36" fill="#fff" opacity=".85">bandas cover de Pearl Jam pelo Brasil</text>`,
  `<rect width="${W}" height="${H}" fill="#1d3557"/><rect width="${W}" height="${H}" fill="#000" opacity=".35"/>`);
}

// Cena do dia: lista de shows, o da vez em destaque (linha amarela + foto grande da banda).
export function dia(data, shows, ativo) {
  const s = shows[ativo], foto = fotoBanda(s.banda);
  const passo = Math.min(150, 560 / shows.length), y0 = 1180;
  const linhas = shows.map((x, i) => {
    const y = y0 + i * passo, on = i === ativo;
    const det = [x.nome, casaDe(x), horaCurta(x.hora)].filter(Boolean).join(" · ");
    return `${on ? `<rect x="50" y="${y - 70}" width="${W - 100}" height="${passo - 12}" fill="${COR.amarelo}"/>` : ""}
    <text x="80" y="${y - 8}" font-family="${F_ANTON}" font-size="60" fill="${on ? COR.fundo : "#fff"}">${esc(`${x.cidade}/${x.uf}`.toUpperCase())}</text>
    <text x="80" y="${y + 38}" font-family="${F_INTER_SB}" font-size="34" fill="${on ? COR.fundo : "#fff"}" opacity="${on ? 1 : 0.8}">${esc(det)}</text>`;
  }).join("");
  const retrato = foto ? `<clipPath id="c"><circle cx="${W / 2}" cy="760" r="230"/></clipPath>
    <image href="${b64(foto)}" x="${W / 2 - 230}" y="530" width="460" height="460" clip-path="url(#c)" preserveAspectRatio="xMidYMid slice"/>
    <circle cx="${W / 2}" cy="760" r="230" fill="none" stroke="${COR.amarelo}" stroke-width="10"/>` : "";
  return svg(`${marca}
  <text x="70" y="370" font-family="${F_ANTON}" font-size="210" fill="#fff">${nomeDia(data)}</text>
  <text x="${W - 70}" y="370" text-anchor="end" font-family="${F_ANTON}" font-size="90" fill="${COR.amarelo}">${data.slice(8)}/${data.slice(5, 7)}</text>
  ${retrato}
  <text x="${W / 2}" y="1060" text-anchor="middle" font-family="${F_INTER_XB}" font-size="44" fill="${COR.amarelo}">@${esc(s.banda)}</text>
  ${linhas}`);
}

export const fecho = () => svg(`${marca.replace("#fff", COR.fundo)}
  <text x="70" y="760" font-family="${F_ANTON}" font-size="200" fill="${COR.fundo}">TODA</text>
  <text x="70" y="960" font-family="${F_ANTON}" font-size="200" fill="${COR.fundo}">TERÇA TEM</text>
  <rect x="0" y="1060" width="${W}" height="170" fill="${COR.fundo}"/>
  <text x="70" y="1175" font-family="${F_ANTON}" font-size="96" fill="${COR.amarelo}">SEGUE @SMUFDPJ</text>
  <text x="70" y="1360" font-family="${F_INTER_SB}" font-size="40" fill="${COR.fundo}">agenda completa:</text>
  <text x="70" y="1415" font-family="${F_INTER_XB}" font-size="40" fill="${COR.fundo}">somaisumfadepearljam.com.br/agenda</text>`,
  `<rect width="${W}" height="${H}" fill="${COR.amarelo}"/>`);
