// Reordena a fila de cápsulas pra espalhar assunto parecido no calendário.
//
// O problema que isso resolve: as matérias são escritas em levas, uma leva por
// entrevista, e a fila era preenchida na ordem de escrita. Resultado: seis dias
// seguidos da MESMA entrevista, com as mesmas pessoas e os mesmos temas.
//
// Guloso: percorre as datas livres em ordem e, pra cada uma, escolhe entre as
// pendentes a que estiver mais "longe" do que já foi agendado perto dali.
// Penaliza, em ordem de peso: mesmo vídeo de origem > mesmo subject > tags em
// comum. Nunca mexe em cápsula já postada.
//
// Uso:
//   node scripts/news/youtube/reordenar-fila.mjs            (simula e mostra)
//   node scripts/news/youtube/reordenar-fila.mjs --aplicar  (grava a fila)

import fs from "node:fs";
import path from "node:path";

const ACERVO = path.resolve("media/news/youtube-acervo");
const RASC = path.join(ACERVO, "_rascunhos.json");
const QUEUE = path.join(ACERVO, "_capsula-queue.json");
const APLICAR = process.argv.includes("--aplicar");

// REGRAS DURAS: distância mínima garantida, não é só preferência
const MIN_DIAS_MESMO_VIDEO = 6;    // teto real: o maior grupo tem 12 matérias em ~79 vagas
const MIN_DIAS_MESMO_SUBJECT = 3;  // duas matérias sobre a mesma pessoa
const MIN_DIAS_MESMA_TAG = 7;      // duas matérias que dividem tag específica

const JANELA = 14;            // quantas publicações pra trás o algoritmo olha
const PESO_VIDEO = 100;       // mesma entrevista de origem: o pior caso
const PESO_SUBJECT = 22;      // mesma pessoa no foco
const PESO_TAG = 8;           // cada tag em comum
// tags que estão em quase tudo não dizem nada sobre semelhança de assunto
const TAGS_GENERICAS = new Set(["pearl-jam", "bastidores", "historia", "eddie-vedder",
  "jeff-ament", "stone-gossard", "mike-mccready", "matt-cameron", "banda"]);

const rasc = JSON.parse(fs.readFileSync(RASC, "utf8"));
const fila = JSON.parse(fs.readFileSync(QUEUE, "utf8"));
const porId = new Map(rasc.map((c) => [c.id, c]));

const postadas = fila.filter((e) => e.postedAt);
const pendentes = fila.filter((e) => !e.postedAt);
const datasLivres = pendentes.map((e) => e.publishAt).sort();

// respeita as distâncias mínimas? `recentes` vem com a data de cada uma
function respeitaMinimos(cap, dataAlvo, recentes) {
  const alvo = new Date(dataAlvo);
  for (const { cap: ant, data } of recentes) {
    const dias = (alvo - new Date(data)) / 86400000;
    if (ant.videoId === cap.videoId && dias < MIN_DIAS_MESMO_VIDEO) return false;
    if (ant.subject && ant.subject === cap.subject && dias < MIN_DIAS_MESMO_SUBJECT) return false;
    if (dias < MIN_DIAS_MESMA_TAG) {
      const tags = new Set((ant.tags || []).filter((t) => !TAGS_GENERICAS.has(t)));
      const comuns = (cap.tags || []).filter((t) => !TAGS_GENERICAS.has(t) && tags.has(t)).length;
      if (comuns >= 2) return false;
    }
  }
  return true;
}

// custo de colocar `cap` logo depois da sequência `recentes` (mais recente por último)
function custo(cap, recentes) {
  let total = 0;
  for (let i = 0; i < recentes.length; i++) {
    const anterior = recentes[i] && recentes[i].cap;
    if (!anterior) continue;
    // quanto mais perto no calendário, mais pesa
    const proximidade = (i + 1) / recentes.length;
    if (anterior.videoId === cap.videoId) total += PESO_VIDEO * proximidade;
    if (anterior.subject && anterior.subject === cap.subject) total += PESO_SUBJECT * proximidade;
    const tags = new Set((anterior.tags || []).filter((t) => !TAGS_GENERICAS.has(t)));
    for (const t of cap.tags || []) if (!TAGS_GENERICAS.has(t) && tags.has(t)) total += PESO_TAG * proximidade;
  }
  return total;
}

// começa considerando o que já foi postado, pra não repetir logo na emenda
const recentes = postadas.slice(-JANELA)
  .map((e) => ({ cap: porId.get(e.id), data: e.publishAt }))
  .filter((x) => x.cap);
const disponiveis = pendentes.map((e) => porId.get(e.id)).filter(Boolean);
const ordem = [];

// ESPALHAMENTO PROPORCIONAL: cada entrevista de origem tem suas matérias
// distribuídas por todo o calendário, em intervalos iguais. Um grupo de k
// matérias em N vagas fica com ~N/k dias entre cada uma, que é o máximo
// matematicamente possível. Depois o guloso só desempata o resto.
const grupos = new Map();
for (const cap of disponiveis) {
  if (!grupos.has(cap.videoId)) grupos.set(cap.videoId, []);
  grupos.get(cap.videoId).push(cap);
}
const N = datasLivres.length;
const marcados = [];
let g = 0;
for (const [, itens] of [...grupos.entries()].sort((a, b) => b[1].length - a[1].length)) {
  const k = itens.length;
  // offset diferente por grupo, pra dois grupos grandes não caírem sempre juntos
  const offset = (g * 0.37) % 1;
  itens.forEach((cap, j) => marcados.push({ pos: ((j + offset) * N) / k, cap }));
  g++;
}
marcados.sort((a, b) => a.pos - b.pos);

// dentro de cada vizinhança, o guloso ainda evita repetir a mesma pessoa em dias seguidos
let forcados = 0;
const pendentesOrdenadas = marcados.map((m) => m.cap);
for (let i = 0; i < datasLivres.length && pendentesOrdenadas.length; i++) {
  const data = datasLivres[i];
  // olha só as 4 próximas da ordem proporcional, pra não desmanchar o espalhamento
  const janelaCurta = pendentesOrdenadas.slice(0, 4);
  let validas = janelaCurta.filter((cap) => respeitaMinimos(cap, data, recentes));
  // se a janela curta não tem nenhuma aceitável, procura na lista inteira antes
  // de aceitar uma ruim: espalhamento perfeito vale menos que não repetir fonte
  if (!validas.length) validas = pendentesOrdenadas.slice(0, 12).filter((cap) => respeitaMinimos(cap, data, recentes));
  const pool = validas.length ? validas : janelaCurta;
  if (!validas.length) forcados++;

  let melhor = pool[0], melhorCusto = Infinity;
  for (const cap of pool) {
    const c = custo(cap, recentes);
    if (c < melhorCusto) { melhorCusto = c; melhor = cap; }
  }
  ordem.push({ data, cap: melhor, custo: melhorCusto });
  pendentesOrdenadas.splice(pendentesOrdenadas.indexOf(melhor), 1);
  recentes.push({ cap: melhor, data });
  if (recentes.length > JANELA) recentes.shift();
}

/* ---------- relatório ---------- */
function paresProximos(seq, dias = 7) {
  let n = 0;
  for (let i = 0; i < seq.length; i++) {
    for (let j = i + 1; j < seq.length; j++) {
      const d = (new Date(seq[j].data) - new Date(seq[i].data)) / 86400000;
      if (d > dias) break;
      const a = seq[i].cap, b = seq[j].cap;
      const comuns = (a.tags || []).filter((t) => !TAGS_GENERICAS.has(t) && (b.tags || []).includes(t)).length;
      if (a.videoId === b.videoId || comuns >= 2) n++;
    }
  }
  return n;
}

// menor distância observada entre duas matérias da mesma entrevista
function menorDistanciaMesmoVideo(seq) {
  let min = Infinity;
  const ultima = new Map();
  for (const o of seq) {
    const ant = ultima.get(o.cap.videoId);
    if (ant) min = Math.min(min, (new Date(o.data) - new Date(ant)) / 86400000);
    ultima.set(o.cap.videoId, o.data);
  }
  return min === Infinity ? "n/d" : Math.round(min) + " dias";
}

const antes = pendentes.map((e) => ({ data: e.publishAt, cap: porId.get(e.id) })).filter((x) => x.cap);
console.log(`pendentes: ${pendentes.length}`);
console.log(`pares parecidos a menos de 7 dias  ANTES: ${paresProximos(antes)}`);
console.log(`                                  DEPOIS: ${paresProximos(ordem)}`);
console.log(`menor intervalo entre matérias da MESMA entrevista  ANTES: ${menorDistanciaMesmoVideo(antes)}`);
console.log(`                                                  DEPOIS: ${menorDistanciaMesmoVideo(ordem)}`);
if (forcados) console.log(`(${forcados} datas onde não deu pra respeitar todos os mínimos)`);
{
  const ultima = new Map(); const ruins = [];
  for (const o of ordem) {
    const ant = ultima.get(o.cap.videoId);
    if (ant) { const d = (new Date(o.data) - new Date(ant.data)) / 86400000;
      if (d < MIN_DIAS_MESMO_VIDEO) ruins.push(`${Math.round(d)}d: ${ant.data.slice(5,10)} ${ant.cap.title_capa.slice(0,30)} -> ${o.data.slice(5,10)} ${o.cap.title_capa.slice(0,30)}`); }
    ultima.set(o.cap.videoId, o);
  }
  console.log(`pares da mesma entrevista abaixo de ${MIN_DIAS_MESMO_VIDEO} dias: ${ruins.length}`);
  ruins.slice(0, 12).forEach((x) => console.log("   " + x));
}
console.log("");
console.log("primeiras 14 datas na ordem nova:");
for (const o of ordem.slice(0, 14)) {
  console.log(`  ${o.data.slice(0, 10)}  ${(o.cap.subject || "").padEnd(15)} ${o.cap.title_capa.slice(0, 44)}`);
}

if (!APLICAR) { console.log("\n(simulação; rode com --aplicar pra gravar)"); process.exit(0); }

const nova = [...postadas, ...ordem.map((o) => ({ id: o.cap.id, publishAt: o.data, postedAt: null }))];
fs.writeFileSync(QUEUE, JSON.stringify(nova, null, 2));
console.log(`\nfila regravada: ${nova.length} entradas (${postadas.length} já postadas preservadas)`);
