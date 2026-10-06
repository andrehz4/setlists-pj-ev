// Tempo do story por banda. O desenho do Claude Design é função de T (segundos "autorais", 0 a 15). O vídeo real
// tem 21 s: entram cortes de b-roll entre as cenas e o final segura até a voz acabar. Este módulo converte o
// segundo real em { T, broll } e guarda as curvas de animação do MOTION-SPEC-banda.
export const enter = (x) => 1 - Math.pow(1 - x, 3);
export const pop = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
export const move = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
// p(T, t0, d, ease): progresso 0..1 de uma animação que começa em t0 e dura d
export const p = (T, t0, d, ease = enter) => ease(clamp((T - t0) / d));

// Roteiro real (s). broll = índice do trecho de clipe que cobre a tela inteira naquele intervalo.
export const ROTEIRO = [
  { r0: 0, r1: 3.0, t0: 0, t1: 3.0 },          // abertura (sobre o clipe 0)
  { r0: 3.0, r1: 5.5, t0: 3.0, t1: 5.5 },      // logo
  { r0: 5.5, r1: 6.2, broll: 1 },              // corte de b-roll
  { r0: 6.2, r1: 9.7, t0: 5.5, t1: 9.0 },      // mapa
  { r0: 9.7, r1: 14.2, t0: 9.0, t1: 12.5 },    // shows (esticado, tempo de leitura)
  { r0: 14.2, r1: 14.9, broll: 2 },            // corte de b-roll
  { r0: 14.9, r1: 21.3, t0: 12.5, t1: 15.0 },  // final (anima em 2,5 s e segura)
];
export const DURACAO = 21.3;

export function momento(r) {
  const s = ROTEIRO.find((x) => r >= x.r0 && r < x.r1) || ROTEIRO.at(-1);
  if (s.broll !== undefined) return { broll: s.broll, T: null };
  const animado = s === ROTEIRO.at(-1) ? Math.min(1, (r - s.r0) / 2.5) : (r - s.r0) / (s.r1 - s.r0);
  return { T: lerp(s.t0, s.t1, clamp(animado)), broll: null };
}

// Onde cada fala entra (s reais). A velocidade é calculada pela duração real (encaixe.mjs).
export const FALAS = [
  { chave: "abertura", em: 0.3 },
  { chave: "whoosh", em: 6.0 },
  { chave: "estado", em: 6.7 },
  { chave: "data", em: 10.0 },
  { chave: "hora", em: 11.5 },
  { chave: "final", em: 14.6 },
];
