// Layout D, cenas 4 (lista de shows: "QUANDO" + data, uma linha por show com filete, cidade grande e a segunda linha
// número/hora/casa, 9 a 12.5) e 5 (bloco chapado pedindo pra compartilhar, site da agenda e @smufdpj, 12.5 a 15).
import { mask, filete, pr, out, io, larg, cabe, dataCurta, horaD } from "./pecas.mjs";

const URL = "somaisumfadepearljam.com.br/agenda";

// linhas da cena 4: até 3 shows na faixa 880 a 1620 (spec); 4 ou mais sobem pra 740 com folga menor
export function modeloShows(story) {
  const N = story.shows.length, muitos = N >= 4;
  const y0 = muitos ? 740 : 880, y1 = 1620, gap = muitos ? 18 : 30, slot = (y1 - y0 - gap * (N - 1)) / N;
  const F = Math.min(130, (slot - (muitos ? 74 : 104)) / 1.26), rowH = 1.26 * F + 74;
  const data = `${dataCurta(story.dia)}${N > 1 ? ` · ${N} SHOWS` : ""}`;
  let y = y0 + (y1 - y0 - (N * rowH + (N - 1) * gap)) / 2;
  const linhas = story.shows.map((s, i) => {
    const cidade = String(s.cidade).toUpperCase(), ry = y, sF = 0.62 * F;
    y += rowH + gap;
    const cityY = ry + 24 + 0.78 * F, l2Y = cityY + 26 + 0.465 * F, partes = [];
    if (N > 1) partes.push({ t: String(i + 1).padStart(2, "0"), F: sF, fonte: "ab", cor: "blk" });
    if (s.hora) partes.push({ t: horaD(s.hora), F: sF, fonte: "ab", cor: "ink" });
    let x = 60;
    partes.forEach((q) => { q.x = x; x += larg(q.t, q.F, q.fonte) + 28; });
    const sub = s.casa || (s.hora ? null : `detalhes no ${story.conta || "perfil da banda"}`);
    const fCasa = Math.max(28, Math.min(44, 0.3 * F));
    if (sub) partes.push({ t: sub, F: cabe(sub, 1020 - x, fCasa, "xb"), fonte: "xb", cor: "ink", x });
    return { ry, cidade, fc: cabe(cidade, 960, F), cityY, l2Y, partes, on: 9.35 + i * 0.3 };
  });
  return { data, fData: cabe(data, 960, 120), linhas };
}

export function cenaShows(T, story, cor, M) {
  if (T < 9 || T >= 12.5) return "";
  const S = M.shows;
  return mask("QUANDO", { y: 280, F: 28, fonte: "xb", fill: cor.ink, p: pr(T, 9.05, 0.4) }) +
    mask(S.data, { y: 410, F: S.fData, fill: cor.ink, p: pr(T, 9.05, 0.3) }) +
    S.linhas.map((l) => filete(l.ry, pr(T, l.on, 0.35, io), cor.ink) +
      mask(l.cidade, { y: l.cityY, F: l.fc, fill: cor.ink, p: pr(T, l.on + 0.05, 0.4) }) +
      l.partes.map((q, j) => mask(q.t, { x: q.x, y: l.l2Y, F: q.F, fonte: q.fonte, fill: cor[q.cor],
        p: pr(T, l.on + 0.15 + j * 0.05, 0.4) })).join("")).join("");
}

export function cenaFinal(T, cor) {
  if (T < 12.5) return "";
  const m = (t) => pr(T, t, 0.38, out), r = (t) => pr(T, t, 0.4, io), on = cor.on;
  const L = ["COMPARTILHA", "COM QUEM VAI", "COM VOCÊ"], fL = Math.min(100, ...L.map((t) => cabe(t, 960, 100)));
  return `<rect width="1080" height="1920" fill="${cor.blk}"/>` +
    mask("SÓ MAIS UM FÃ DE PEARL JAM", { y: 280, F: 30, fonte: "xb", fill: on, p: m(12.5) }) + filete(312, r(12.5), on) +
    L.map((t, i) => mask(t, { y: 540 + i * 112, F: fL, fill: on, p: m(12.5 + i * 0.06) })).join("") +
    filete(1120, r(12.85), on) +
    mask("AGENDA COMPLETA", { y: 1170, F: 28, fonte: "xb", fill: on, p: m(12.9) }) +
    mask(URL, { y: 1240, F: cabe(URL, 960, 44, "xb"), fonte: "xb", fill: on, p: m(12.95) }) +
    filete(1330, r(13.05), on) +
    mask("SIGA", { y: 1380, F: 28, fonte: "xb", fill: on, p: m(13.1) }) +
    mask("@smufdpj", { y: 1560, F: cabe("@smufdpj", 960, 140), fill: on, p: m(13.15) });
}
