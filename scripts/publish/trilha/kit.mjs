// Kit da trilha própria: lê o entrega-setlists.json do trilha-hz (faixas do Suno Premier com instrumentos separados).
// O áudio mora no SSD do Andre; sem o SSD, carregarKit devolve null e quem chama segue com a trilha antiga.
import fs from "node:fs";

export const ENTREGA_PADRAO = "/Volumes/SSD Terra Gentil/trilha-hz/pearl-jam/entrega-setlists.json";

// Volume de cada família por nível (dB; null = mudo). Teclado é onde mora o piano: é a base do "magro".
export const NIVEIS = {
  magro: {},   // uma família melódica só, escolhida pelo mixar.mjs no trecho (piano primeiro)
  medio: { teclado: 0, baixo: 0, bateria: -3, guitarra: -9, sintetizador: -4, cordas: -4, percussao: -6 },
  cheio: { teclado: 0, baixo: 0, bateria: 0, guitarra: 0, sintetizador: 0, cordas: 0, percussao: 0, outro: -3 },
};

export function carregarKit(caminho = process.env.TRILHA_ENTREGA || ENTREGA_PADRAO) {
  if (!fs.existsSync(caminho)) return null;
  const kit = JSON.parse(fs.readFileSync(caminho, "utf8"));
  const faltam = kit.camas.flatMap((c) => Object.values(c.pistas).map((p) => p.arquivo)).filter((a) => !fs.existsSync(a));
  if (faltam.length) throw new Error(`trilha: ${faltam.length} pista(s) do kit sumiram, ex.: ${faltam[0]}`);
  return kit;
}

export function acharCama(kit, id) {
  const c = kit.camas.find((x) => x.id === id);
  if (!c) throw new Error(`trilha: cama ${id} não existe (${kit.camas.map((x) => x.id).join(", ")})`);
  if (!c.acr?.passou) throw new Error(`trilha: cama ${id} não passou no ACRCloud`);
  return c;
}

// Onde começar a tocar a faixa: candidatos em que uma parte cheia da música cai no instante `golpeEm` do vídeo
// (na ordem da faixa), mais o começo depois da intro como reserva. Quem escolhe é o mixar.mjs (escolherJanela).
export function iniciosCandidatos(cama, golpeEm, duracao) {
  const teto = cama.duracao_s - duracao - 0.5;
  const alvos = cama.partes.filter((p) => p.nivel === "cheio").map((p) => p.de);
  alvos.push(Math.max(cama.comeco_sem_bateria_s, golpeEm));
  return [...new Set(alvos.map((a) => Math.max(0, Math.min(a - golpeEm, teto))).map((x) => Math.round(x * 10) / 10))];
}
