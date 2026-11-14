// Correções manuais da agenda (media/agenda/correcoes.json): legenda ambígua que o extrator não tem como acertar
// ("28/11 Iron Rock" é casa, não cidade). Chave = id do show (estável: sai da legenda), valor = campos que trocam.
// A coleta aplica a cada run, então a correção sobrevive à releitura do post. Show que já passou: a chave fica inerte.
import { naRaiz } from "../config.mjs";
import { lerEstado } from "../lib/estado.mjs";

export const CORRECOES = naRaiz("media/agenda/correcoes.json");
const CAMPOS = new Set(["casa", "casaNome", "cidade", "uf", "hora", "observacao", "fechado"]);

// Função pura: devolve os shows com as correções aplicadas (id não muda, pra a chave seguir valendo).
export function aplicarCorrecoes(shows, correcoes = {}) {
  return shows.map((s) => {
    const c = correcoes[s.id];
    if (!c) return s;
    const invalidos = Object.keys(c).filter((k) => !CAMPOS.has(k));
    if (invalidos.length) throw new Error(`correcoes.json: campo não permitido em ${s.id}: ${invalidos.join(", ")}`);
    return { ...s, ...c };
  });
}

export async function lerCorrecoes(caminho = CORRECOES) {
  const doc = await lerEstado(caminho, { correcoes: {} });
  return doc.correcoes || {};
}
