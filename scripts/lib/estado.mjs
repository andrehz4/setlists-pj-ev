// Leitura de arquivos de estado JSON (media/news/*, logs de story/reel, denylist, cooldown).
// Regra do projeto: arquivo AUSENTE vira o valor padrão; arquivo CORROMPIDO derruba a run.
// Motivo: o fallback silencioso fazia a run achar que o estado estava vazio e gravar por cima
// no commit seguinte (denylist sumindo, seen.json zerado, story/reel duplicado).
import fs from "node:fs/promises";
import path from "node:path";

export class EstadoCorrompido extends Error {
  constructor(caminho, motivo) {
    super(`estado corrompido: ${caminho} (${motivo}). A run parou pra não gravar por cima; conserte o arquivo no repo.`);
    this.name = "EstadoCorrompido";
    this.caminho = caminho;
  }
}

const copia = (v) => (v === undefined ? v : structuredClone(v));

// lerEstado(caminho, padrao, { valida }) -> objeto
// valida(doc) opcional: devolve string com o problema de formato, ou falsy se ok.
export async function lerEstado(caminho, padrao, { valida } = {}) {
  let raw;
  try {
    raw = await fs.readFile(caminho, "utf8");
  } catch (e) {
    if (e.code === "ENOENT") return copia(padrao);
    throw e;
  }
  let doc;
  try {
    doc = JSON.parse(raw);
  } catch (e) {
    throw new EstadoCorrompido(caminho, e.message);
  }
  const problema = valida ? valida(doc) : null;
  if (problema) throw new EstadoCorrompido(caminho, problema);
  return doc;
}

export async function gravarEstado(caminho, doc) {
  await fs.mkdir(path.dirname(caminho), { recursive: true });
  await fs.writeFile(caminho, JSON.stringify(doc, null, 2) + "\n", "utf8");
}

// Validador comum: doc é objeto e doc[campo] é array.
export const comLista = (campo) => (doc) =>
  doc && typeof doc === "object" && Array.isArray(doc[campo]) ? null : `sem .${campo}[]`;
