// Layout N, cenas 4 (programação: o ponteiro para em cada estação = show de hoje, 9 a 12.5) e 5 (pedido de
// compartilhar no visor + link digitado, 12.5 a 15).
import { p, pop, enter, clamp } from "../../tempo.mjs";
import { gabinete, placa, visor, dial, vu, botao, label, luz, procura, freqDe, fmt, sintoniza, cabe, largInter,
  esc, F_ANTON, F_INTER, F_INTER_XB } from "./pecas.mjs";

const hora = (h) => (h ? String(h).replace(/^(\d{1,2}):?(\d{2})?$/, (_, a, b) => `${a.padStart(2, "0")}:${b || "00"}`) : null);

export function cenaShows(T, story, cor) {
  if (T < 9 || T >= 12.5) return "";
  const N = story.shows.length, passo = 2.7 / N;
  const fs = story.shows.map((s) => freqDe(`${s.cidade}${s.casa || ""}${s.hora || ""}`));
  const ativo = clamp(Math.floor((T - 9.3) / passo), 0, N - 1);
  const fAgora = T < 9.3 ? fs[0] : procura(T, ativo ? fs[ativo - 1] : 88, fs[ativo], 9.3 + ativo * passo, 0.55);
  let s = gabinete(cor) + label("PROGRAMAÇÃO DE HOJE", 540, 300, cor, { f: 34, anc: "middle", fill: cor.rotulo }) +
    placa(60, 340, 960, 230, cor) + dial(T, { x: 90, y: 375, w: 900, h: 160, freq: fAgora, cor, marcas: fs.map((f) => ({ f })) });
  const gap = 24, alto = Math.min(360, (860 - (N - 1) * gap) / N), e = Math.min(1.1, alto / 320);
  const y0 = 620 + (860 - (N * alto + (N - 1) * gap)) / 2;
  story.shows.forEach((sh, i) => {
    const y = y0 + i * (alto + gap), op = p(T, 9.15 + i * 0.25, 0.3, enter);
    if (op <= 0) return;
    const ligado = i === ativo && T >= 9.3, h = hora(sh.hora);
    const sub = [h, sh.casa].filter(Boolean).join(" · ") || "horário no perfil da banda";
    const fF = 120 * e, fC = cabe(sh.cidade, 540, 70 * e), fS = cabe(sub, 540, 44 * e);
    const txt = `<text x="130" y="${(y + alto * 0.56).toFixed(1)}" font-family="${F_ANTON}" font-size="${fF.toFixed(1)}" fill="${cor.luz}">${fmt(fs[i])}</text>
      <text x="132" y="${(y + alto * 0.56 + 46 * e).toFixed(1)}" font-family="${F_INTER_XB}" font-weight="800" font-size="${(30 * e).toFixed(1)}" fill="${cor.luz}" opacity="0.6">MHz</text>
      <text x="420" y="${(y + alto * 0.45).toFixed(1)}" font-family="${F_INTER_XB}" font-weight="800" font-size="${fC.toFixed(1)}" fill="${cor.luz}">${esc(sintoniza(T, sh.cidade, 9.2 + i * 0.25, 0.35))}</text>
      <text x="420" y="${(y + alto * 0.45 + fS * 1.5).toFixed(1)}" font-family="${F_INTER}" font-size="${fS.toFixed(1)}" fill="${cor.luz}" opacity="0.8">${esc(sub)}</text>`;
    s += `<g opacity="${(op * (ligado ? 1 : 0.5)).toFixed(3)}" transform="translate(${((1 - op) * 80).toFixed(1)} 0)">${visor(80, y, 920, alto, cor)}
      ${ligado ? `<rect x="80" y="${y}" width="920" height="${alto}" rx="16" fill="none" stroke="${cor.acento}" stroke-width="6"/>` : ""}${ligado ? luz(txt, 0.7) : txt}</g>`;
  });
  return s + placa(60, 1520, 960, 200, cor) + vu(T, { cx: 260, cy: 1650, r: 78, cor, semente: 3, rotulo: "L" }) +
    vu(T, { cx: 540, cy: 1650, r: 78, cor, semente: 6, rotulo: "R" }) + botao(830, 1620, 60, (fAgora - 88) * 14, cor);
}

export function cenaFinal(T, cor) {
  if (T < 12.5) return "";
  const linhas = ["COMPARTILHA", "COM QUEM VAI", "COM VOCÊ"];
  const titulo = linhas.map((l, i) => `<text x="540" y="${540 + i * 170}" text-anchor="middle" font-family="${F_ANTON}" font-size="150" fill="${i === 0 ? cor.acento : cor.luz}">${esc(sintoniza(T, l, 12.55 + i * 0.15, 0.45))}</text>`).join("");
  const siga = p(T, 13.3, 0.35, pop);
  const site = "somaisumfadepearljam.com.br/agenda", n = Math.round(site.length * clamp((T - 13.6) / 0.9));
  const cursor = Math.floor(T * 3) % 2 === 0 && n < site.length ? "|" : "";
  const fl = cabe(site, 820, 44);
  return gabinete(cor) + label("ÚLTIMA CHAMADA", 540, 300, cor, { f: 34, anc: "middle", fill: cor.rotulo }) +
    placa(60, 340, 960, 1380, cor) + visor(90, 370, 900, 630, cor) + luz(titulo) +
    (siga > 0 ? `<g transform="translate(540 1100) scale(${siga.toFixed(3)}) translate(-540 -1100)"><rect x="110" y="1040" width="860" height="120" rx="60" fill="${cor.acento}"/>
      <text x="540" y="1120" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="56" fill="#ffffff">Siga @smufdpj</text></g>` : "") +
    visor(90, 1200, 900, 110, cor) + luz(`<text x="130" y="${1255 + fl * 0.36}" font-family="${F_INTER_XB}" font-weight="800" font-size="${fl.toFixed(1)}" fill="${cor.luz}">${esc(site.slice(0, n))}${cursor}</text>`) +
    vu(T, { cx: 260, cy: 1600, r: 90, cor, semente: 2, rotulo: "L" }) + vu(T, { cx: 540, cy: 1600, r: 90, cor, semente: 5, rotulo: "R" }) +
    botao(830, 1550, 70, 200 + 40 * Math.sin(T * 1.5), cor) + label("VOLUME", 830, 1665, cor, { f: 24, anc: "middle" });
}
