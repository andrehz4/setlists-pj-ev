// Lê as coleções JSON embutidas no index.html (uma por linha: `const NOME = {...};`).
// É a fonte da verdade do SPA; as páginas estáticas de SEO derivam dela.
import fs from "node:fs";

export function lerColecao(html, nome) {
  const linha = html.split("\n").find(l => l.startsWith(`const ${nome} =`));
  if (!linha) throw new Error(`index.html sem const ${nome}`);
  return JSON.parse(linha.replace(/^const \w+ = /, "").replace(/;\s*$/, ""));
}

export function lerDadosSite(caminho = "index.html") {
  const html = fs.readFileSync(caminho, "utf8");
  return {
    shows: lerColecao(html, "SHOWS"),
    albums: lerColecao(html, "ALBUMS"),
    midia: lerColecao(html, "MEDIA_MANIFEST"),
  };
}
