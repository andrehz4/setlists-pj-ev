// Gera dados/fotos-reserva.js: o acervo de fotos (media/band/subjects/) que o SITE usa quando a notícia
// não tem foto própria. Mesmas pessoas e mesmos padrões do Instagram (SUBJECTS do subject-fallback.mjs),
// então a regra fica num lugar só. Sem pessoa citada, cai no pool "banda".
// Mexeu no acervo? Rode: node scripts/news/foto-reserva/gerar.mjs
import fs from "node:fs";
import path from "node:path";
import { naRaiz } from "../../config.mjs";
import { SUBJECTS, SUBJECTS_ROOT } from "../../publish/subject-fallback.mjs";

export const SAIDA = naRaiz("dados/fotos-reserva.js");

const fotosDe = (key) => {
  const dir = path.join(SUBJECTS_ROOT, key);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /\.(jpe?g)$/i.test(f)).sort()
    .map((f) => `/media/band/subjects/${key}/${encodeURIComponent(f)}`);
};

export function montar() {
  const pessoas = SUBJECTS.map((s) => ({ re: s.match.source, fotos: fotosDe(s.key) }))
    .filter((p) => p.fotos.length);
  return { pessoas, banda: fotosDe("banda") };
}

export function conteudo() {
  return "// Fotos de reserva das notícias sem imagem (gerado por scripts/news/foto-reserva/gerar.mjs, não editar).\n"
    + "// Uma linha só: `const FOTOS_RESERVA = <JSON>;`. Quem usa: _newsImg() no index.html.\n"
    + `const FOTOS_RESERVA = ${JSON.stringify(montar())};\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fs.writeFileSync(SAIDA, conteudo());
  const m = montar();
  console.log(`dados/fotos-reserva.js: ${m.pessoas.length} pessoas, ${m.banda.length} fotos da banda`);
}
