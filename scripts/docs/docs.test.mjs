// Docs pra agentes: PROGRESSO.md com teto de tamanho e CLAUDE.md sem apontar pra arquivo que não existe.
// Doc que mente sobre o repo é pior que doc nenhum (agente segue o caminho errado com confiança).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ler = (f) => fs.readFileSync(path.join(RAIZ, f), "utf8");

test("PROGRESSO.md com até 300 linhas (resto vai pra docs/progresso/AAAA-MM.md)", () => {
  const n = ler("PROGRESSO.md").split("\n").length;
  assert.ok(n <= 300, `PROGRESSO.md tem ${n} linhas; mova sessões antigas pra docs/progresso/`);
});

// Caminhos entre crases que começam numa pasta do repo. Ignora placeholders e o que é gitignored de propósito.
const PASTAS = /^(scripts|docs|backend|mock-ig|functions|colab|media|cloudflare-worker|\.github)\//;
const IGNORA = /[<>*{}]|AAAA|^design-handoff\//;

for (const doc of ["CLAUDE.md", "README.md", "scripts/lib/README.md", "scripts/publish/README.md",
  "scripts/publish/reel/README.md", "scripts/contrib/README.md", "functions/README.md"]) {
  test(`${doc}: todo caminho citado existe`, () => {
    const base = path.dirname(path.join(RAIZ, doc));
    const faltando = [];
    for (const [, c] of ler(doc).matchAll(/`([^`\s]+)`/g)) {
      const p = c.replace(/[),.:;]+$/, "");
      if (IGNORA.test(p)) continue;
      const naRaiz = PASTAS.test(p) && fs.existsSync(path.join(RAIZ, p));
      const relativo = /\.(mjs|js|md|json|sh|yml)$|\/$/.test(p) && fs.existsSync(path.join(base, p));
      if (PASTAS.test(p) ? !naRaiz : (/\//.test(p) && /\.(mjs|js|md|sh|yml)$/.test(p) && !relativo)) faltando.push(p);
    }
    assert.deepEqual(faltando, [], `${doc} cita caminhos que não existem`);
  });
}
