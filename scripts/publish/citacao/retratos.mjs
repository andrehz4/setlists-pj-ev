// Quem está falando na citação? Lê o campo "autor" da cápsula (texto livre,
// ex: "Eddie Vedder, em 1990", "Jeff Ament, segundo Dave Krusen") e devolve
// o nome, o contexto e a foto curada de media/band/retratos/.
// Sem retrato conhecido, foto = null e o slide sai sem o círculo.

import fs from "node:fs";
import path from "node:path";

export const RETRATOS_DIR = path.resolve("media/band/retratos");
const CATALOGO = path.join(RETRATOS_DIR, "retratos.json");

let _catalogo = null;
export function carregarCatalogo() {
  if (!_catalogo) _catalogo = JSON.parse(fs.readFileSync(CATALOGO, "utf8")).pessoas;
  return _catalogo;
}

// Arquivo final do retrato: <slug>-<n>.jpg (n a partir de 1).
export function arquivoRetrato(slug, n) {
  return path.join(RETRATOS_DIR, `${slug}-${n}.jpg`);
}

// Hash estável (FNV-1a) pra escolher a mesma foto sempre pra mesma cápsula.
function hash(s) {
  let h = 2166136261;
  for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function norm(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

// Acha o slug de UM nome ("Eddie Vedder", "Stone"); só casa nome inteiro.
function slugDoNome(nome, catalogo) {
  const n = norm(nome);
  for (const [slug, p] of Object.entries(catalogo)) {
    if (p.apelidos.some((a) => norm(a) === n)) return slug;
  }
  return null;
}

// "Eddie Vedder, em 1990" -> { nome: "Eddie Vedder", contexto: "em 1990" }.
// Autor com duas pessoas ("Eddie Vedder e Stone Gossard") não ganha foto.
export function resolverAutor(autor, seed = "", catalogo = carregarCatalogo()) {
  const bruto = String(autor || "").trim() || "Eddie Vedder";
  const i = bruto.indexOf(",");
  const nome = (i >= 0 ? bruto.slice(0, i) : bruto).trim();
  const contexto = i >= 0 ? bruto.slice(i + 1).trim() : "";
  const slug = slugDoNome(nome, catalogo);
  if (!slug) return { nome, contexto, slug: null, foto: null };
  const total = catalogo[slug].fotos.length;
  const n = (hash(seed) % total) + 1;
  return { nome: catalogo[slug].nome, contexto, slug, foto: arquivoRetrato(slug, n) };
}
