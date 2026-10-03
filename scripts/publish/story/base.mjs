// Base do vídeo do story (1080x1920, 30 fps): medidas, linha do tempo e estado da abertura.
export const W = 1080;
export const H = 1920;
export const FPS = 30;

// Linha do tempo dinâmica: abertura + N cards + final (1 notícia = 1 card, sem repetir).
export const T_INTRO_END = 3.0; // com narração, a abertura dura o tempo da fala
export const T_CARD_DUR = 3.5;
export const T_OUTRO_DUR = 1.5;

const MONTH_PT = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
const MONTH_PT_LONG = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
const DOW_PT_SHORT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const DOW_PT_LONG = ["DOMINGO", "SEGUNDA-FEIRA", "TERÇA-FEIRA", "QUARTA-FEIRA", "QUINTA-FEIRA", "SEXTA-FEIRA", "SÁBADO"];

// Estado que os estilos de abertura/final (story-styles/) recebem. Badge: frames base64 do GIF
// (badgeFps>0), PNG estático (badgeFps=0, 1 frame) ou ausente (badgeFrames=null).
export function buildIntroState({ date, itemCount, tarjaColor, badgeAnim, edition }) {
  return {
    W, H,
    day: date.getUTCDate(),
    month: date.getUTCMonth() + 1,
    monthShort: MONTH_PT[date.getUTCMonth()],
    monthLong: MONTH_PT_LONG[date.getUTCMonth()],
    year: date.getUTCFullYear(),
    dayOfWeekShort: DOW_PT_SHORT[date.getUTCDay()],
    dayOfWeekLong: DOW_PT_LONG[date.getUTCDay()],
    edition,
    itemCount,
    tarjaColor,
    badgeFrames: badgeAnim?.frames || null,
    badgeFps: badgeAnim?.fps || 0,
    badgeTotalFrames: badgeAnim?.totalFrames || 0,
    badgePngBase64: badgeAnim?.frames?.[0] || null, // compat: 1º frame
  };
}

// Qual trecho (abertura, card, final) corresponde a um instante global.
export function resolveSegment(tGlobal, itemsCount, introEnd = T_INTRO_END) {
  if (tGlobal < introEnd) return { kind: "intro", tRel: tGlobal };
  const afterIntro = tGlobal - introEnd;
  for (let i = 0; i < itemsCount; i++) {
    const start = i * T_CARD_DUR;
    if (afterIntro < start + T_CARD_DUR) return { kind: "card", index: i, tRel: afterIntro - start };
  }
  return { kind: "outro", tRel: afterIntro - itemsCount * T_CARD_DUR };
}
