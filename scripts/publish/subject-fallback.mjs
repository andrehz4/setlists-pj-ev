// Fallback por ASSUNTO. Quando a noticia nao tem foto propria, em vez da
// rotacao aleatoria do band-fallback (qualquer integrante), usa uma foto da
// PESSOA que a noticia cita (ex: noticia do Jack Irons -> foto do Jack Irons).
// Entra ANTES do fallback generico; a foto propria do item continua com
// prioridade.
//
// As fotos vivem em media/band/subjects/<chave>/ (1 a 3 cada). Esse diretorio
// fica FORA da rotacao generica do band-fallback (que le so o nivel raiz de
// media/band/), entao foto de pessoa especifica nao vaza pro pool aleatorio.
// A escolha dentro do pool da pessoa reusa pickFallback (rotacao por id + dia).
import fs from "node:fs/promises";
import path from "node:path";
import { pickFallback } from "./band-fallback.mjs";

export const SUBJECTS_ROOT = path.resolve("media/band/subjects");

// Mapa pessoa -> pasta + padrao de deteccao. Ordem importa: numa noticia que
// cita mais de um, o PRIMEIRO match vence (Jack Irons em primeiro por ser o
// caso recorrente sem foto). Padroes aceitam espaco ou hifen entre nome e
// sobrenome (cobre "Jack Irons" e a tag "jack-irons"). Sobrenome sozinho so
// entra quando e inequivoco; "irons", "gaspar", "krusen" exigem nome completo.
export const SUBJECTS = [
  { key: "jack-irons",      match: /\bjack[\s\-]+irons\b/i },
  { key: "eddie-vedder",    match: /\beddie[\s\-]+vedder\b|\bvedder\b/i },
  { key: "mike-mccready",   match: /\bmike[\s\-]+mccready\b|\bmccready\b/i },
  { key: "stone-gossard",   match: /\bstone[\s\-]+gossard\b|\bgossard\b/i },
  { key: "jeff-ament",      match: /\bjeff[\s\-]+ament\b|\bament\b/i },
  { key: "boom-gaspar",     match: /\bboom[\s\-]+gaspar\b/i },
  { key: "matt-cameron",    match: /\bmatt[\s\-]+cameron\b|\bcameron\b/i },
  { key: "dave-abbruzzese", match: /\bdave[\s\-]+abbruzzese\b|\babbruzzese\b/i },
  { key: "dave-krusen",     match: /\bdave[\s\-]+krusen\b|\bkrusen\b/i },
  { key: "josh-klinghoffer",match: /\bjosh[\s\-]+klinghoffer\b|\bklinghoffer\b/i },
];

// Monta o texto onde procurar o assunto: titulo(s) + intro + tags.
export function haystackFor(item) {
  if (!item) return "";
  const parts = [
    item.title_pt, item.title_ig, item.titulo_pt,
    item.intro_pt, item.subtitle_pt,
    Array.isArray(item.tags) ? item.tags.join(" ") : "",
  ];
  return parts.filter(Boolean).join(" ");
}

// Detecta a CHAVE da pessoa citada (ou null). Separado pra ser testavel sem
// tocar o disco.
export function detectSubject(item, subjects = SUBJECTS) {
  const hay = haystackFor(item);
  if (!hay) return null;
  for (const s of subjects) {
    if (s.match.test(hay)) return s.key;
  }
  return null;
}

// Lista as fotos (jpg) do pool de uma pessoa, em ordem. Vazio se a pasta nao
// existir.
async function poolFor(key, root = SUBJECTS_ROOT) {
  try {
    const dir = path.join(root, key);
    const entries = await fs.readdir(dir);
    return entries
      .filter((f) => /\.(jpg|jpeg)$/i.test(f))
      .sort()
      .map((f) => path.join(dir, f));
  } catch {
    return [];
  }
}

// Retorna o caminho de uma foto da pessoa citada na noticia, ou null se nao
// houver pessoa detectada ou pool vazio. Dentro do pool, escolhe por rotacao
// (id + dia), pra notas diferentes da mesma pessoa nao saírem sempre iguais.
export async function subjectFallbackPath(item, root = SUBJECTS_ROOT, subjects = SUBJECTS) {
  const key = detectSubject(item, subjects);
  if (!key) return null;
  const pool = await poolFor(key, root);
  if (pool.length === 0) return null;
  return pickFallback(pool, item && item.id);
}
