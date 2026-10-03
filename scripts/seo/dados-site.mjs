// Lê as coleções do site em dados/*.js (uma linha `const NOME = {...};` cada), o PJ_MEMBERS do index.html
// e os arquivos de texto. É a fonte da verdade do SPA; as páginas de SEO derivam dela.
import fs from "node:fs";
import vm from "node:vm";

export function lerColecao(html, nome) {
  const linha = html.split("\n").find(l => l.startsWith(`const ${nome} =`));
  if (!linha) throw new Error(`sem const ${nome}`);
  return JSON.parse(linha.replace(/^const \w+ = /, "").replace(/;\s*$/, ""));
}

// PJ_MEMBERS é uma IIFE com sprites; roda isolada só pra pegar nome, papel e texto.
export function lerMembros(html) {
  const ini = html.indexOf("const PJ_MEMBERS = (function() {");
  if (ini < 0) return [];
  const fim = html.indexOf("\n})();", ini);
  const codigo = html.slice(ini, fim + 6).replace("const PJ_MEMBERS =", "resultado =");
  const ctx = { resultado: null };
  vm.runInNewContext(codigo, ctx, { timeout: 1000 });
  return Array.from(ctx.resultado || [], m => ({ id: m.id, name: m.name, role: m.role, bio: { ...m.bio }, text: m.text || "" }));
}

const lerJson = p => JSON.parse(fs.readFileSync(p, "utf8"));

export function lerDadosSite(raiz = ".") {
  const html = fs.readFileSync(`${raiz}/index.html`, "utf8");
  const dado = (arq, nome) => lerColecao(fs.readFileSync(`${raiz}/dados/${arq}`, "utf8"), nome);
  const albums = dado("albums.js", "ALBUMS");
  const ensaios = {};
  for (const a of albums) {
    const p = `${raiz}/media/albums/${a.id}.md`;
    if (fs.existsSync(p)) ensaios[a.id] = fs.readFileSync(p, "utf8");
  }
  const capas = new Set(albums.map(a => a.id).filter(id => fs.existsSync(`${raiz}/media/albums/${id}.jpg`)));
  return {
    shows: dado("shows.js", "SHOWS"),
    albums,
    songsDb: dado("songs-db.js", "SONGS_DB").songs,
    midia: dado("media-manifest.js", "MEDIA_MANIFEST"),
    interpretacoes: lerJson(`${raiz}/media/interpretations.json`),
    notas: lerJson(`${raiz}/media/lyrics-notes.json`),
    membros: lerMembros(html),
    ensaios,
    capas,
  };
}
