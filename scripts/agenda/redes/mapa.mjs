// Mapa do story da agenda: localiza a cidade de cada show (lista do IBGE em media/agenda/geo/), agrupa os shows por
// cidade e projeta tudo num retângulo de desenho, enquadrado na região dos shows. Funções puras, testadas.
import fs from "node:fs";
import { naRaiz } from "../../config.mjs";

const ler = (f) => JSON.parse(fs.readFileSync(naRaiz(`media/agenda/geo/${f}`), "utf8"));
let _ufs, _mun;
export const ufs = () => (_ufs ||= ler("ufs.json"));
const mun = () => (_mun ||= ler("municipios.json"));

const norm = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
// abreviações que as bandas usam nas legendas
const APELIDOS = { pta: "paulista", sto: "santo", sta: "santa", s: "sao", sjc: "sao jose dos campos", bh: "belo horizonte",
  sp: "sao paulo", rj: "rio de janeiro", poa: "porto alegre" };

// { pos: [lon, lat], nome } da cidade (nome oficial do IBGE: "Bragança Pta" vira "Bragança Paulista"; nome cortado
// que só um município completa, como "São Bernardo", também acha); sem achar, o meio do estado com o nome como veio e
// aproximado: true (o ponto nunca fica fora do mapa); sem estado, null.
export function localizar(cidade, uf) {
  const m = mun()[uf];
  if (!m) return null;
  const n = norm(cidade);
  const exp = n.split(" ").map((p) => APELIDOS[p] || p).join(" ");
  const comeco = n ? Object.keys(m).filter((k) => k.startsWith(`${exp} `)) : [];
  const achou = m[n] || m[exp] || (APELIDOS[n] && m[APELIDOS[n]]) || (comeco.length === 1 && m[comeco[0]]);
  if (achou) return { pos: [achou[0], achou[1]], nome: achou[2] || cidade };
  return { pos: centroUf(uf), nome: cidade || uf, aproximado: true };
}

// Meio do estado (média dos pontos do maior polígono): ponto de reserva e lugar da sigla no mapa.
export function centroUf(uf) {
  const maior = ufs()[uf].reduce((a, p) => (p.length > a.length ? p : a), []);
  return [maior.reduce((a, p) => a + p[0], 0) / maior.length, maior.reduce((a, p) => a + p[1], 0) / maior.length];
}

// Shows do dia -> cidades (um ponto por cidade, com os shows dela), na ordem de oeste pra leste.
export function cidadesDoDia(shows) {
  const porCidade = new Map();
  for (const s of shows) {
    if (!s.uf) continue;
    const l = localizar(s.cidade, s.uf);
    const k = `${norm(l ? l.nome : s.cidade)}|${s.uf}`; // pelo nome oficial: "Bragança Pta" e "Bragança Paulista" juntos
    if (!porCidade.has(k)) porCidade.set(k, { cidade: l ? l.nome : s.cidade, uf: s.uf, pos: l && l.pos, shows: [] });
    porCidade.get(k).shows.push(s);
  }
  return [...porCidade.values()].filter((c) => c.pos).sort((a, b) => a.pos[0] - b.pos[0]);
}

// Projeção: enquadra os pontos (com folga e tamanho mínimo, pra mostrar os estados em volta) no retângulo
// x, y, w, h. Longitude achatada pelo cosseno da latitude média, pra o mapa não sair esticado.
export function projecao(pontos, { x, y, w, h, folga = 2.2, minimo = 9 }) {
  const lons = pontos.map((p) => p[0]), lats = pontos.map((p) => p[1]);
  const cx = (Math.min(...lons) + Math.max(...lons)) / 2, cy = (Math.min(...lats) + Math.max(...lats)) / 2;
  const k = Math.cos((cy * Math.PI) / 180);
  let largura = Math.max((Math.max(...lons) - Math.min(...lons)) * k + folga * 2, minimo);
  let altura = Math.max(Math.max(...lats) - Math.min(...lats) + folga * 2, minimo);
  if (largura / altura > w / h) altura = (largura * h) / w; else largura = (altura * w) / h;
  const esc = w / largura;
  return ([lon, lat]) => [x + w / 2 + (lon - cx) * k * esc, y + h / 2 - (lat - cy) * esc];
}

// Contorno dos estados como caminhos SVG já projetados.
export const caminhosUf = (proj) => Object.entries(ufs()).map(([uf, polys]) => ({
  uf, d: polys.map((p) => `M${p.map((pt) => proj(pt).map((v) => v.toFixed(1)).join(",")).join("L")}Z`).join(""),
}));
