// Confere os textos finais do kit antes de agendar no X (o /x-hoje reescreve condensado
// e roda isto): tamanho como o X conta (link = 23), travessão, link (só onde comLink) e hashtags.
//   node scripts/publish/x/conferir.mjs [.x-kit/<dia>/kit.json]
import fs from "node:fs";
import { tamanhoX, LIMITE } from "./texto.mjs";
import { hojeBRT } from "./kit-do-dia.mjs";

export function problemas(texto, { comLink = true } = {}) {
  const p = [];
  if (tamanhoX(texto) > LIMITE) p.push(`passou de ${LIMITE} (${tamanhoX(texto)})`);
  if (/[—–]/.test(texto)) p.push("tem travessão");
  const temLink = /https?:\/\//.test(texto);
  if (comLink && !/https:\/\/somaisumfadepearljam\.com\.br\/n\//.test(texto)) p.push("sem link da matéria");
  if (!comLink && temLink) p.push("link onde não devia (só 1 post com link por dia)");
  if (!comLink && !/link na bio/.test(texto)) p.push("sem \"link na bio\"");
  if (!/#PearlJam/.test(texto)) p.push("sem #PearlJam");
  if (/…/.test(texto)) p.push("texto cortado (…)");
  return p;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arq = process.argv[2] || `.x-kit/${hojeBRT()}/kit.json`;
  const kit = JSON.parse(fs.readFileSync(arq, "utf8"));
  let ruins = 0;
  for (const post of kit.posts) {
    const p = problemas(post.texto, { comLink: post.comLink !== false });
    ruins += p.length > 0;
    console.log(`${post.horario} ${post.tipo} ${tamanhoX(post.texto)}/${LIMITE} ${p.length ? `PROBLEMA: ${p.join("; ")}` : "ok"}`);
  }
  process.exit(ruins ? 1 : 0);
}
