// Show da Semana, linha de comando (regras no README desta pasta).
//   node scripts/publish/show-da-semana/cli.mjs folego            material disponível e ritmo sugerido
//   node scripts/publish/show-da-semana/cli.mjs novo pj:1996-11-15  cria o rascunho da ficha
//   node scripts/publish/show-da-semana/cli.mjs checar             valida todas as fichas (sai 1 se houver erro)
import fs from "node:fs";
import path from "node:path";
import { RAIZ } from "../../config.mjs";
import { folego } from "./acervo.mjs";
import { rascunho, validar, caminhoFicha, lerFichas, proximoNumero, PASTA_FICHAS } from "./ficha.mjs";

const [cmd, arg] = process.argv.slice(2);

if (cmd === "folego") {
  const f = folego(RAIZ);
  const fichas = lerFichas(RAIZ);
  console.log(`Shows do site com pôster no repo: ${f.comPosterNoRepo} (prontos pra capa)`);
  console.log(`Shows do site sem pôster: ${f.doSiteSemPoster}`);
  console.log(`Setlists no acervo do setlist.fm: ${f.setlistFm} (precisam de pôster e história pesquisados)`);
  console.log(`Fichas: ${fichas.length} (${fichas.filter((x) => x.ficha.status === "publicado").length} publicadas)`);
  console.log(`Com 1 por semana, os prontos duram ${f.comPosterNoRepo} semanas sem pesquisa de pôster.`);
} else if (cmd === "novo") {
  const f = rascunho(RAIZ, arg, proximoNumero(RAIZ));
  const destino = caminhoFicha(RAIZ, f.id);
  if (fs.existsSync(destino)) throw new Error(`ficha já existe: ${destino}`);
  fs.mkdirSync(path.join(RAIZ, PASTA_FICHAS), { recursive: true });
  fs.writeFileSync(destino, JSON.stringify(f, null, 2) + "\n");
  console.log(`rascunho: ${destino}`);
  console.log(`falta: ${validar(f).join("; ")}`);
} else if (cmd === "checar") {
  let ruim = 0;
  for (const { arquivo, ficha } of lerFichas(RAIZ)) {
    const erros = validar(ficha);
    if (ficha.status === "rascunho") { console.log(`${arquivo}: rascunho (${erros.length} pendências)`); continue; }
    if (erros.length) { ruim++; console.log(`${arquivo}: ${erros.join("; ")}`); } else console.log(`${arquivo}: ok`);
  }
  process.exit(ruim ? 1 : 0);
} else {
  console.log("uso: cli.mjs folego | novo pj:AAAA-MM-DD | checar");
  process.exit(2);
}
