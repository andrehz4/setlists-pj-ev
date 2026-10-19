// Pasta temporária pra teste que se apaga sozinha quando o processo do teste termina (antes cada rodada da suíte
// deixava centenas de pastas em /var/folders).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const criadas = [];
process.on("exit", () => { for (const d of criadas) fs.rmSync(d, { recursive: true, force: true }); });

export function pastaTemp(prefixo = "teste-") {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), prefixo));
  criadas.push(d);
  return d;
}
