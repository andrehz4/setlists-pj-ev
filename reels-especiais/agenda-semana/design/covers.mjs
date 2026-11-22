// Fundo das cenas dos dias: trechos das próprias covers (acervo media/reels-clips/covers/<conta>/clips.json),
// na ordem dos shows do dia, cada show com sua fatia de tempo. Trechos já vêm 9:16, mudos e com rosto centrado.
import fs from "node:fs";
import path from "node:path";
import { naRaiz } from "../../../scripts/config.mjs";

const PEDACO = 2.4; // segundos máximos de cada trecho na tela
const usados = new Set();

function trechosDa(conta) {
  const f = naRaiz(`media/reels-clips/covers/${conta}/clips.json`);
  if (!fs.existsSync(f)) return [];
  const pasta = path.dirname(f);
  return JSON.parse(fs.readFileSync(f, "utf8")).clips
    .filter((c) => (c.nota || 0) >= 3 && !(c.tags || []).some((t) => String(t).startsWith("marca:")))
    .map((c) => ({ ...c, arq: path.join(pasta, c.file) }))
    .filter((c) => fs.existsSync(c.arq))
    .sort((a, b) => (b.broll?.plano === "close") - (a.broll?.plano === "close") || (b.nota || 0) - (a.nota || 0));
}

// Lista de pedaços { arq, dur } que cobre `duracao` s, dividida igual entre os shows do dia.
export function fundoDoDia(shows, duracao) {
  const fatia = duracao / shows.length, out = [];
  for (const s of shows) {
    const lista = trechosDa(s.banda);
    const n = Math.max(1, Math.ceil(fatia / PEDACO)), d = fatia / n;
    for (let k = 0; k < n; k++) {
      const c = lista.find((x) => !usados.has(x.arq) && x.dur >= d) || lista.find((x) => x.dur >= d);
      if (!c) { out.push({ arq: null, dur: d }); continue; }
      usados.add(c.arq);
      out.push({ arq: c.arq, dur: d });
    }
  }
  return out;
}
