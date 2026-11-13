// Porta de entrada da trilha própria no publish (reel, story diário, story da agenda).
// Devolve { name, path, propria: true } com a trilha já mixada no plano de níveis, ou null quando a flag
// TRILHA_PROPRIA não está ligada, o kit não existe ou o R2 falhou: aí quem chama segue com a trilha antiga.
import { lerKitPublicado, materializarCama } from "./r2.mjs";
import { iniciosCandidatos } from "./kit.mjs";
import { golpesDoPlano } from "./plano.mjs";
import { escolherJanela, montarTrilha } from "./mixar.mjs";

// Camas por uso (campo "uso" da entrega do trilha-hz). null = todas (o reel da semana roda o kit inteiro).
export const CAMAS_POR_USO = {
  reel: null,
  story: ["hz-pj-03a", "hz-pj-03b", "hz-pj-04a", "hz-pj-04b"],
  agenda: ["hz-pj-04a", "hz-pj-04b", "hz-pj-03b"],
};

function hash(s) {
  let h = 2166136261;
  for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

// Rodízio determinístico: a mesma semente (semana ISO, dia, dia+banda) sempre dá a mesma cama.
export function camaDoDia(kit, uso, semente) {
  const ids = CAMAS_POR_USO[uso];
  const lista = kit.camas.filter((c) => c.acr?.passou && (!ids || ids.includes(c.id)));
  if (!lista.length) throw new Error(`trilha: nenhuma cama pro uso ${uso}`);
  return lista[hash(semente) % lista.length];
}

export function trilhaPropria({ uso, semente, plano, duracao, saida, env = process.env,
  lerKit = lerKitPublicado, materializar = materializarCama, montar = montarTrilha } = {}) {
  if (env.TRILHA_PROPRIA !== "1") return null;
  try {
    const kit = lerKit();
    if (!kit) { console.warn("[trilha] kit-publicado.json não existe, segue a trilha antiga"); return null; }
    const cama = materializar(camaDoDia(kit, uso, semente));
    if (!cama) { console.warn("[trilha] pistas não baixaram do R2, segue a trilha antiga"); return null; }
    const golpe = golpesDoPlano(plano)[0] ?? 0;
    const { inicio, magro } = escolherJanela(cama, plano, iniciosCandidatos(cama, golpe, duracao));
    const r = montar({ cama, plano, inicio, magro, duracao, saida });
    console.log(`[trilha] ${uso}: ${cama.id} (${cama.titulo}) a partir de ${inicio.toFixed(1)} s, calmo em ${r.magro}`);
    return { name: `${cama.id} ${cama.titulo}`, path: r.saida, propria: true };
  } catch (e) {
    console.warn(`[trilha] falhou, segue a trilha antiga: ${e.message.slice(0, 200)}`);
    return null;
  }
}
