// Dedupe por similaridade de conteudo. Usado pra detectar replicas de wire
// (AP, Reuters, press release de gravadora) entre sites brasileiros que
// publicam quase o mesmo texto com 30min de diferenca.
//
// Algoritmo:
//   1. Normaliza titulo+snippet (lowercase, remove acentos+pontuacao+stopwords PT)
//   2. Gera shingles (sequencias de N palavras consecutivas) pra cada item
//   3. Calcula Jaccard pairwise: |A ∩ B| / |A ∪ B|
//   4. Cluster por threshold (default 0.65) via union-find
//   5. Em cada cluster, mantem o item com TEXTO MAIS LONGO (mais detalhe editorial)
//
// So compara items dentro do MESMO grupo (ex: group="br") porque dedupe entre
// EUA e BR nao faz sentido (cada audiencia recebe a fonte mais relevante).

const SHINGLE_SIZE = 4;

const STOPWORDS_PT = new Set([
  "o", "a", "os", "as", "de", "do", "da", "dos", "das",
  "e", "ou", "mas", "se", "que", "como", "porque",
  "em", "no", "na", "nos", "nas", "ao", "aos", "à", "às",
  "um", "uma", "uns", "umas",
  "com", "por", "para", "pelo", "pela", "pelos", "pelas",
  "mais", "menos", "ja", "já", "só", "so", "muito", "muita",
  "este", "esta", "esse", "essa", "isso", "isto", "aquele", "aquela",
  "the", "of", "a", "an", "and", "or", "to", "in", "on", "at", "for", "with",
]);

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && w.length > 1 && !STOPWORDS_PT.has(w))
    .join(" ");
}

function shinglize(text, n = SHINGLE_SIZE) {
  const words = text.split(/\s+/).filter(Boolean);
  const shingles = new Set();
  if (words.length === 0) return shingles;
  if (words.length < n) {
    shingles.add(words.join(" "));
    return shingles;
  }
  for (let i = 0; i <= words.length - n; i++) {
    shingles.add(words.slice(i, i + n).join(" "));
  }
  return shingles;
}

function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union > 0 ? inter / union : 0;
}

// Recebe array de items (com title + snippet + group + sourceLabel) e retorna:
//   { survivors: [...], removed: [{ item, replacedBy, similarity }] }
// `opts.threshold` (default 0.65): nivel pra considerar replica
// `opts.groupFilter` (default "br"): so dedup dentro desse group; outros groups
//                                    passam intactos
// `opts.getText(item)`: extrai texto pra comparar (default: titulo + snippet)
export function dedupeByContent(items, opts = {}) {
  const threshold = opts.threshold ?? 0.65;
  const groupFilter = opts.groupFilter ?? "br";
  const getText = opts.getText || ((it) => `${it.title || ""} ${it.snippet || ""}`);

  const targetIdx = [];
  const passthrough = [];
  items.forEach((it, i) => {
    if (it.group === groupFilter) targetIdx.push(i);
    else passthrough.push(it);
  });

  if (targetIdx.length <= 1) {
    return { survivors: items, removed: [] };
  }

  const enriched = targetIdx.map((i) => {
    const it = items[i];
    const text = normalize(getText(it));
    return { item: it, text, shingles: shinglize(text), len: text.length };
  });

  // union-find pra cluster por similaridade
  const parent = enriched.map((_, i) => i);
  function find(i) { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; }
  function union(i, j) {
    const ri = find(i), rj = find(j);
    if (ri !== rj) parent[ri] = rj;
  }

  // pra fins de log: registra o melhor par dentro de cada cluster
  const bestSim = new Map();

  for (let i = 0; i < enriched.length; i++) {
    for (let j = i + 1; j < enriched.length; j++) {
      const sim = jaccard(enriched[i].shingles, enriched[j].shingles);
      if (sim >= threshold) {
        union(i, j);
        const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
        bestSim.set(key, sim);
      }
    }
  }

  // agrupa por raiz do cluster
  const groups = new Map();
  enriched.forEach((entry, i) => {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push({ ...entry, _idx: i });
  });

  const survivors = [...passthrough];
  const removed = [];
  for (const [, group] of groups) {
    if (group.length === 1) {
      survivors.push(group[0].item);
      continue;
    }
    // ordem: maior texto vence. desempate: ordem do array original.
    group.sort((a, b) => b.len - a.len || a._idx - b._idx);
    const winner = group[0];
    survivors.push(winner.item);
    for (const loser of group.slice(1)) {
      const key = `${Math.min(winner._idx, loser._idx)}-${Math.max(winner._idx, loser._idx)}`;
      const sim = bestSim.get(key) ?? 0;
      removed.push({
        item: loser.item,
        replacedBy: winner.item,
        similarity: Number(sim.toFixed(3)),
      });
    }
  }

  return { survivors, removed };
}
