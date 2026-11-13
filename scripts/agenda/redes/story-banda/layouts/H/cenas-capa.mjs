// Layout H, cenas 4 (contracapa com a lista de faixas = shows, 9 a 12.5) e 5 (capa final com adesivo, 12.5 a 15).
import { p, pop, enter } from "../../tempo.mjs";
import { disco, adesivo, sobe, cabe, esc, RPM33, F_ARCHIVO, F_SERIF, F_INTER_XB } from "./pecas.mjs";
import { fundo } from "./cenas-disco.mjs";

const hora = (h) => (h ? String(h).replace(/^(\d{1,2}):?(\d{2})?$/, (_, a, b) => `${Number(a)}H${b && b !== "00" ? b : ""}`) : "");
const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function cenaShows(T, story, cor) {
  if (T < 9 || T >= 12.5) return "";
  const d = new Date(`${story.dia}T12:00:00Z`), N = story.shows.length;
  const alto = Math.min(380, 1000 / N), y0 = 560 + (1000 - N * alto) / 2;
  let out = fundo(cor) + sobe(p(T, 9.05, 0.4, enter), { x: 60, y: 400, f: 120, texto: "LADO A", fill: cor.tinta }) +
    `<text x="1020" y="400" text-anchor="end" font-family="${F_SERIF}" font-style="italic" font-size="60" fill="${cor.tinta}">${DIAS[d.getUTCDay()]}. ${story.dia.slice(8)}/${story.dia.slice(5, 7)}</text>
    <rect x="60" y="440" width="960" height="8" fill="${cor.tinta}"/><rect x="60" y="458" width="960" height="2" fill="${cor.tinta}"/>`;
  story.shows.forEach((s, i) => {
    const k = p(T, 9.2 + i * 0.3, 0.45, enter), cidade = s.cidade.toUpperCase(), h = hora(s.hora);
    const esc2 = Math.min(1, alto / 300), f = Math.min(110 * esc2, (960 - 90) / (cidade.length * 0.78)), f2 = 56 * esc2;
    const y = y0 + i * alto + (alto - f - f2 * 1.4) / 2 + f * 0.85, y2 = y + f2 * 1.35, xc = 60 + 90 * esc2;
    const casa = s.casa ? `no ${s.casa}` : "detalhes no perfil da banda";
    const wh = h ? h.length * 0.78 * f2 + 24 : 0;
    out += `<clipPath id="hl${i}"><rect x="0" y="${y - f * 1.1}" width="${(1080 * k).toFixed(1)}" height="${f * 1.1 + f2 * 1.7}"/></clipPath><g clip-path="url(#hl${i})">
      <circle cx="${60 + 32 * esc2}" cy="${y - f * 0.36}" r="${32 * esc2}" fill="${cor.acento}"/>
      <text x="${60 + 32 * esc2}" y="${y - f * 0.36 + 14 * esc2}" text-anchor="middle" font-family="${F_ARCHIVO}" font-size="${(40 * esc2).toFixed(1)}" fill="${cor.sobreAcento}">${i + 1}</text>
      <text x="${xc}" y="${y}" font-family="${F_ARCHIVO}" font-size="${f.toFixed(1)}" fill="${cor.tinta}">${esc(cidade)}</text>
      ${h ? `<text x="${xc}" y="${y2}" font-family="${F_ARCHIVO}" font-size="${f2.toFixed(1)}" fill="${cor.acento}">${h}</text>` : ""}
      <text x="${xc + wh}" y="${y2}" font-family="${F_SERIF}" font-style="italic" font-size="${(f2 * 1.1).toFixed(1)}" fill="${cor.tinta}">${esc(casa)}</text>
      ${i < N - 1 ? `<line x1="60" y1="${y0 + (i + 1) * alto}" x2="1020" y2="${y0 + (i + 1) * alto}" stroke="${cor.tinta}" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round"/>` : ""}</g>`;
  });
  const barras = Array.from({ length: 34 }, (_, j) => `<rect x="${60 + j * 9}" y="1560" width="${[3, 5, 2, 6][(j * 7) % 4]}" height="60" fill="${cor.tinta}"/>`).join("");
  return out + `<g opacity="${(0.55 * p(T, 9.6, 0.4, enter)).toFixed(3)}">${barras}<text x="1020" y="1612" text-anchor="end" font-family="${F_INTER_XB}" font-weight="800" font-size="24" letter-spacing="4" fill="${cor.tinta}">SMUF-${story.dia.slice(8)}${story.dia.slice(5, 7)} · ESTÉREO</text></g>`;
}

export function cenaFinal(T, cor) {
  if (T < 12.5) return "";
  const f = 126, k = (t) => p(T, t, 0.45, enter);
  const linhas = ["COMPARTILHA", "COM QUEM VAI", "COM VOCÊ"].map((l, i) => sobe(k(12.55 + i * 0.1), { x: 60, y: 560 + i * f * 1.05, f: cabe(l, 960, f), texto: l, fill: cor.tinta })).join("");
  const s = p(T, 13.3, 0.4, pop);
  return fundo(cor) +
    disco(T, { cx: 540, cy: 1880, r: 640, ang: (T - 12.5) * RPM33, cor, selo: "@SMUFDPJ" }) +
    `<text x="60" y="330" font-family="${F_SERIF}" font-style="italic" font-size="58" fill="${cor.tinta}" opacity="${k(12.6).toFixed(3)}">Só Mais um Fã de Pearl Jam apresenta</text>` + linhas +
    `<g opacity="${k(13.05).toFixed(3)}"><text x="60" y="1000" font-family="${F_INTER_XB}" font-weight="800" font-size="40" fill="${cor.tinta}">somaisumfadepearljam.com.br/agenda</text>
    <rect x="60" y="1018" width="${(cabeSite()).toFixed(0)}" height="5" fill="${cor.acento}"/></g>` +
    (s > 0 ? adesivo({ cx: 800, cy: 1180, r: 150, rot: -10, s, fundo: cor.acento, cor: cor.sobreAcento, linhas: ["SIGA", "@SMUFDPJ"] }) : "");
}
const cabeSite = () => 34 * 0.6 * 40;
