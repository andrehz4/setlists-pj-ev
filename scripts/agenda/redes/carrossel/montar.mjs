// Monta o carrossel "Agenda da semana": capa (1 ou 2 páginas) + 1 slide por banda + chamada final, até 10 slides.
// Cada slide leva as contas pra marcar nele (banda e casas no slide da banda; as bandas na capa).
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { naRaiz } from "../../../config.mjs";
import { svgCapa, MAX_CAPA } from "./svg-capa.mjs";
import { svgBanda, svgChamada } from "./svg-banda.mjs";

export const MAX_SLIDES = 10;
export const MAX_PAGINAS_CAPA = 2; // até 18 shows listados; passou disso, "+ N show(s)" na última página
const DIR_FOTOS = naRaiz("media/agenda/fotos");

// Resumo do slide: a primeira frase do perfil (o slide quebra em até 3 linhas).
export const resumoCurto = (t) => (String(t || "").match(/^.*?[.!?](\s|$)/)?.[0] || String(t || "")).trim();

// Agrupa por banda (@ da banda), na ordem do primeiro show.
export function bandasDaSemana(lista) {
  const grupos = new Map();
  for (const s of lista.slice().sort((a, b) => a.data.localeCompare(b.data))) {
    const k = s.banda || s.nome;
    if (!grupos.has(k)) grupos.set(k, { conta: s.banda || null, nome: s.nome, shows: [] });
    grupos.get(k).shows.push(s);
  }
  return [...grupos.values()];
}

// Páginas da capa: até 9 shows por página, até MAX_PAGINAS_CAPA, divididos por igual (10 shows = 5 + 5, não 9 + 1).
// Devolve [{ shows, parte, resto }].
export function paginasDaCapa(lista) {
  const ord = lista.slice().sort((a, b) => a.data.localeCompare(b.data));
  const n = Math.min(MAX_PAGINAS_CAPA, Math.max(1, Math.ceil(ord.length / MAX_CAPA)));
  const por = Math.ceil(Math.min(ord.length, n * MAX_CAPA) / n);
  return Array.from({ length: n }, (_, i) => ({
    shows: ord.slice(i * por, Math.min((i + 1) * por, n * MAX_CAPA)),
    parte: n > 1 ? `${i + 1}/${n}` : null,
    resto: i === n - 1 ? Math.max(0, ord.length - n * MAX_CAPA) : 0,
  }));
}

// Plano puro dos slides: [{ tipo: "capa"|"banda"|"chamada", pagina?, grupo?, contas }]. Prioridade nos 10 slides:
// capas (todo show aparece) > bandas > chamada. Bandas que não cabem só aparecem na capa.
export function planoDoCarrossel(lista) {
  const grupos = bandasDaSemana(lista), paginas = paginasDaCapa(lista);
  const slides = paginas.map((pagina) => ({ tipo: "capa", pagina,
    contas: [...new Set(pagina.shows.map((s) => s.banda).filter(Boolean))].slice(0, 20) }));
  const cabem = Math.min(grupos.length, MAX_SLIDES - slides.length);
  for (const g of grupos.slice(0, cabem)) {
    slides.push({ tipo: "banda", grupo: g, contas: [...new Set([g.conta, ...g.shows.map((s) => s.casa)].filter(Boolean))] });
  }
  if (slides.length < MAX_SLIDES) slides.push({ tipo: "chamada", contas: [] });
  return slides;
}

// Foto do perfil da banda como data URI (o librsvg não baixa URL). Sem foto: null (vira carimbo de iniciais).
export async function fotoDaBanda(conta, dir = DIR_FOTOS) {
  if (!conta) return null;
  try {
    const buf = await sharp(path.join(dir, `${conta}.jpg`)).resize(500, 500, { fit: "cover" }).jpeg({ quality: 88 }).toBuffer();
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch (e) {
    if (e.code !== "ENOENT" && !/missing|exist/i.test(e.message)) console.warn(`[agenda-carrossel] foto de ${conta}: ${e.message}`);
    return null;
  }
}

// SVGs do carrossel. bandas: lista de bandas.json (conta, nome, cidade, uf, desde, resumo).
export async function svgsDoCarrossel(lista, bandas, inicio, fim, corId, { dirFotos = DIR_FOTOS } = {}) {
  const porConta = new Map(bandas.map((b) => [b.conta, b]));
  const out = [];
  for (const [i, sl] of planoDoCarrossel(lista).entries()) {
    let svg;
    if (sl.tipo === "capa") svg = svgCapa(sl.pagina.shows, inicio, fim, corId, `cp${i}`, sl.pagina);
    else if (sl.tipo === "chamada") svg = svgChamada(inicio, fim, corId);
    else {
      const b = porConta.get(sl.grupo.conta) || {};
      const banda = { nome: b.nome || sl.grupo.nome, cidade: b.cidade, uf: b.uf, desde: b.desde, resumo: resumoCurto(b.resumo) };
      svg = svgBanda(banda, sl.grupo.shows, inicio, fim, corId, await fotoDaBanda(sl.grupo.conta, dirFotos), `b${i}`);
    }
    out.push({ ...sl, svg });
  }
  return out;
}

// Grava os JPGs em pasta/<prefixo>-NN.jpg. Devolve [{ arquivo, contas, tipo }].
export async function gerarCarrossel(lista, bandas, inicio, fim, corId, pasta, prefixo) {
  await fs.mkdir(pasta, { recursive: true });
  const slides = await svgsDoCarrossel(lista, bandas, inicio, fim, corId);
  const out = [];
  for (const [i, sl] of slides.entries()) {
    const arquivo = path.join(pasta, `${prefixo}-${String(i + 1).padStart(2, "0")}.jpg`);
    await sharp(Buffer.from(sl.svg)).jpeg({ quality: 90, mozjpeg: true }).toFile(arquivo);
    out.push({ arquivo, contas: sl.contas, tipo: sl.tipo });
  }
  return out;
}
