// Monta o carrossel "Agenda da semana": capa (todos os shows) + 1 slide por banda + chamada final, até 10 slides.
// Cada slide leva as contas pra marcar nele (banda e casas no slide da banda; as bandas na capa).
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { naRaiz } from "../../../config.mjs";
import { svgCapa } from "./svg-capa.mjs";
import { svgBanda, svgChamada } from "./svg-banda.mjs";

export const MAX_SLIDES = 10;
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

// Plano puro dos slides: [{ tipo: "capa"|"banda"|"chamada", grupo?, contas }]. Com bandas demais, a chamada sai
// e entram até 9 bandas; as que sobram só aparecem na capa.
export function planoDoCarrossel(lista) {
  const grupos = bandasDaSemana(lista);
  const cabem = grupos.length >= MAX_SLIDES - 1 ? MAX_SLIDES - 1 : grupos.length;
  const slides = [{ tipo: "capa", contas: grupos.map((g) => g.conta).filter(Boolean).slice(0, 20) }];
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
    if (sl.tipo === "capa") svg = svgCapa(lista, inicio, fim, corId);
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
