// Linha do tempo do reel da agenda (pura, testada). Duas réguas:
// - tempo do DESIGN (T): o que o protótipo do Claude Design desenha (cenas Abertura, Mapa, um dia por data, Fecho);
// - tempo do VÍDEO: o mesmo, com um corte da banda em tela cheia (PUNCH s) antes de cada show (padrão aprovado 22/11).
// Constantes iguais ao reel-core.jsx do Design (DAY_INTRO, PER_SHOW, troca do destaque 0,15 s antes da fala).
export const PUNCH = 0.75;
export const FOLGA_FALA = 0.5; // cena nunca corta a fala
const DAY_INTRO = 0.9, PER_SHOW = 1.8;
const BASE = { Abertura: 3, Mapa: 3.5, Fecho: 3 };
const DIAS = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
const cap = (s) => s.charAt(0) + s.slice(1).toLowerCase();
export const nomeDia = (d) => DIAS[new Date(`${d}T12:00:00Z`).getUTCDay()];
// Mesmo nome de cena que o Design monta ("Sexta 27/11"): é a chave das CUES dele.
export const nomeCena = (d) => `${cap(nomeDia(d))} ${d.slice(8)}/${d.slice(5, 7)}`;

// dias: [{ data, n, punch: [bool por show] }]; fala: { Abertura, Mapa, Fecho, <data>: segundos } (ausente = sem voz).
export function montarTempos(dias, fala = {}) {
  const dur = (nome, base, f) => +Math.max(base, f != null ? f + FOLGA_FALA : 0).toFixed(3);
  const cenas = [
    { nome: "Abertura", dur: dur("Abertura", BASE.Abertura, fala.Abertura) },
    { nome: "Mapa", dur: dur("Mapa", BASE.Mapa, fala.Mapa) },
    ...dias.map((d) => ({ nome: nomeCena(d.data), data: d.data, n: d.n, punch: d.punch,
      dur: dur(d.data, Math.max(3, DAY_INTRO + d.n * PER_SHOW), fala[d.data]) })),
    { nome: "Fecho", dur: dur("Fecho", BASE.Fecho, fala.Fecho) },
  ];
  let T = 0;
  for (const c of cenas) { c.S = +T.toFixed(3); T += c.dur; c.End = +T.toFixed(3); }

  // Segmentos do vídeo: trechos do Design (de/ate em T) e cortes da banda (punch), em ordem.
  const segs = [];
  let out = 0;
  const design = (de, ate, extra = {}) => { if (ate - de > 1e-6) { segs.push({ tipo: "design", de, ate, ini: out, ...extra }); out += ate - de; } };
  const [ab, mapa] = cenas;
  design(ab.S, ab.End, { cena: "Abertura" });
  design(mapa.S, mapa.End, { cena: "Mapa" });
  for (const c of cenas.filter((x) => x.data)) {
    // troca do show i: 0,15 s antes da fala dele (o Design espaça igual quando não há voz por show)
    const sw = Array.from({ length: c.n }, (_, i) => (i === 0 ? c.S : c.S + DAY_INTRO + (i * (c.dur - DAY_INTRO)) / c.n - 0.15));
    sw.push(c.End);
    for (let i = 0; i < c.n; i++) {
      if (c.punch?.[i]) { segs.push({ tipo: "punch", cena: c.nome, data: c.data, show: i, ini: out, dur: PUNCH }); out += PUNCH; }
      design(sw[i], sw[i + 1], { cena: c.nome, data: c.data, show: i });
    }
  }
  const fecho = cenas.at(-1);
  design(fecho.S, fecho.End, { cena: "Fecho" });
  for (const s of segs) s.ini = +s.ini.toFixed(4);
  return { cenas, segs, totalDesign: +T.toFixed(3), total: +out.toFixed(4) };
}

// Tempo do vídeo -> tempo do Design (null = dentro de um corte da banda, sem desenho por cima).
export function tempoDesign(segs, t) {
  for (const s of segs) {
    const d = s.tipo === "punch" ? s.dur : s.ate - s.de;
    if (t < s.ini + d - 1e-9) return s.tipo === "punch" ? null : s.de + (t - s.ini);
  }
  const u = segs.at(-1);
  return u.tipo === "punch" ? null : u.ate - 1e-3;
}

// Onde cada fala começa no vídeo (0,15 s depois do início da cena; no dia, depois do 1º corte) e os whooshes.
export function marcasDeAudio({ cenas, segs }) {
  const inicioDaCena = (nome) => segs.find((s) => s.cena === nome && s.tipo === "design").ini;
  const falas = cenas.map((c) => ({ chave: c.data || c.nome, em: +(inicioDaCena(c.nome) + 0.15).toFixed(3) }));
  const whoosh = [inicioDaCena("Mapa"), ...segs.filter((s) => s.tipo === "punch").map((s) => s.ini), inicioDaCena("Fecho")];
  // dia sem nenhum corte: o whoosh vai na entrada da cena
  for (const c of cenas.filter((x) => x.data && !x.punch?.some(Boolean))) whoosh.push(inicioDaCena(c.nome));
  return { falas, whoosh: [...new Set(whoosh.map((w) => +w.toFixed(3)))].sort((a, b) => a - b) };
}
