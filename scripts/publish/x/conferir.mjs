// Confere os textos finais do kit antes de agendar no X (o /x-hoje reescreve condensado
// e roda isto): tamanho como o X conta (link = 23), travessão, link e hashtags.
//   node scripts/publish/x/conferir.mjs [.x-kit/<dia>/kit.json]
import fs from "node:fs";
import { tamanhoX, LIMITE } from "./texto.mjs";
import { hojeBRT } from "./kit-do-dia.mjs";

export function problemas(texto) {
  const p = [];
  if (tamanhoX(texto) > LIMITE) p.push(`passou de ${LIMITE} (${tamanhoX(texto)})`);
  if (/[—–]/.test(texto)) p.push("tem travessão");
  if (!/https:\/\/somaisumfadepearljam\.com\.br\/n\//.test(texto)) p.push("sem link da matéria");
  if (!/#PearlJam/.test(texto)) p.push("sem #PearlJam");
  if (/…/.test(texto)) p.push("texto cortado (…)");
  return p;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arq = process.argv[2] || `.x-kit/${hojeBRT()}/kit.json`;
  const kit = JSON.parse(fs.readFileSync(arq, "utf8"));
  let ruins = 0;
  for (const post of kit.posts) {
    const p = problemas(post.texto);
    ruins += p.length > 0;
    console.log(`${post.horario} ${post.tipo} ${tamanhoX(post.texto)}/${LIMITE} ${p.length ? `PROBLEMA: ${p.join("; ")}` : "ok"}`);
  }
  process.exit(ruins ? 1 : 0);
}
