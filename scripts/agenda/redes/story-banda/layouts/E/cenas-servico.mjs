// Layout E ("Bilhete"), cenas 4 (9 a 12.5: dia e data no topo, cada show vira um ingresso de papel com picote e
// canhoto da hora que desliza da direita) e 5 (12.5 a 15: "Compartilha com quem vai com você", site e Siga @smufdpj).
import { pr, out, io, lerp, f1, txt, fade, rotulo, orn, caber, estrela, dataDe, fmtHora, ROMANO } from "./pecas.mjs";

const FAIXA = { y0: 500, y1: 1620 }, FOLGA = 40, PIC = 700, NR = 22, ROT = [-1.2, 1, -0.6, 0.8];
const URL = "somaisumfadepearljam.com.br/agenda";

function ingresso(T, s, i, N, h, y, story, cor) {
  const on = 9.35 + 0.28 * i, p = pr(T, on, 0.45, out);
  if (p <= 0) return "";
  const x = 60 + 1100 * (1 - p), rot = lerp(4, ROT[i % 4], p), tinta = cor.bg;
  const fr = Math.min(22, 0.08 * h), yr = 0.2 * h + 10, hc = 830;
  const corpo = `M0 0H${PIC - NR}A${NR} ${NR} 0 0 0 ${PIC + NR} 0H960V${f1(h)}` +
    `H${PIC + NR}A${NR} ${NR} 0 0 0 ${PIC - NR} ${f1(h)}H0Z`;
  const cf = Math.min(0.36 * h, caber(s.cidade, 640, 400));
  const sub = s.casa || (s.hora ? null : `detalhes no ${story.conta}`);
  const sf = sub ? Math.min(30, 0.11 * h, caber(sub, 640, 30, "in")) : 0;
  const hora = fmtHora(s.hora), hf = hora ? Math.min(0.3 * h, caber(hora, 220, 400, "pf9")) : 0;
  const rotTxt = N > 1 ? `ENTRADA ${ROMANO[i] || i + 1}` : "ENTRADA";
  return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)} 480 ${f1(h / 2)})">
    <rect x="6" y="10" width="960" height="${f1(h)}" fill="#000" fill-opacity="0.25"/><path d="${corpo}" fill="${cor.paper}"/>
    <rect x="14" y="14" width="932" height="${f1(h - 28)}" fill="none" stroke="${tinta}" stroke-width="1.5"/>
    <line x1="${PIC}" y1="${NR + 8}" x2="${PIC}" y2="${f1(h - NR - 8)}" stroke="${tinta}" stroke-width="2"
      stroke-dasharray="6 8"/>
    ${txt(40, yr, rotTxt, fr, tinta, { fonte: "in", anchor: "start", ls: 0.3 * fr })}
    ${txt(40, 0.62 * h, s.cidade, cf, tinta, { anchor: "start" })}
    ${sub ? txt(40, Math.min(h - 22, Math.max(h - 40, 0.74 * h + sf)), sub, sf, tinta, { fonte: "in", anchor: "start" }) : ""}
    ${txt(hc, yr, "HORA", fr, tinta, { fonte: "in", ls: 0.3 * fr })}
    ${hora ? txt(hc, 0.5 * h + hf * 0.36 + 10, hora, hf, tinta, { fonte: "pf9" })
    : `<path d="${estrela(0.12 * h)}" transform="translate(${hc} ${f1(0.55 * h)})" fill="${tinta}"/>`}</g>`;
}

export function cenaShows(T, story, cor) {
  if (T < 9 || T >= 12.5) return "";
  const N = story.shows.length, d = dataDe(story.dia), data = `${d.d} de ${d.mes}`;
  const h = Math.min(320, (FAIXA.y1 - FAIXA.y0 - FOLGA * (N - 1)) / N);
  const y0 = FAIXA.y0 + (FAIXA.y1 - FAIXA.y0 - (N * h + (N - 1) * FOLGA)) / 2;
  const rot = d.dia.toUpperCase() + (N > 1 ? ` · ${N} SHOWS` : "");
  return rotulo(540, 290, rot, pr(T, 9.02, 0.3, out), cor.gold) +
    fade(540, 410, data, caber(data, 940, 130), cor.paper, pr(T, 9.02, 0.35, out)) +
    story.shows.map((s, i) => ingresso(T, s, i, N, h, y0 + i * (h + FOLGA), story, cor)).join("");
}

export function cenaFinal(T, story, cor) {
  if (T < 12.5) return "";
  const L = ["Compartilha", "com quem vai", "com você"], pc = pr(T, 13.15, 0.6, out), P = 2 * (700 + 230);
  const caixa = pc > 0 ? `<rect x="190" y="1240" width="700" height="230" fill="none" stroke="${cor.gold}" stroke-width="2"` +
    ` stroke-dasharray="${P}" stroke-dashoffset="${f1(P * (1 - pc))}"/>` : "";
  return L.map((t, i) => fade(540, 540 + 165 * i, t, caber(t, 940, 160), i === 2 ? cor.gold : cor.paper,
    pr(T, 12.5 + 0.12 * i, 0.5, out))).join("") +
    orn(540, 960, 520, pr(T, 12.85, 0.6, io), cor.gold) +
    rotulo(540, 1060, "AGENDA COMPLETA", pr(T, 12.95, 0.5, out), cor.gold, 26) +
    fade(540, 1130, URL, caber(URL, 900, 40, "in"), cor.paper, pr(T, 13, 0.5, out), { fonte: "in" }) +
    caixa + fade(540, 1330, "Siga", 76, cor.gold, pc) +
    fade(540, 1430, "@smufdpj", 96, cor.paper, pr(T, 13.25, 0.6, out), { fonte: "pf9" }) +
    fade(540, 1570, "Só Mais um Fã de Pearl Jam", 36, cor.gold, pr(T, 13.4, 0.6, out), { fonte: "pf5" });
}
