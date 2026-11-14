// Layout N, cena 3 (5.5 a 9): o visor vira radar e capta o sinal no estado do show. Mapa em fósforo, varredura
// girando, cada cidade pisca quando a varredura passa e o ponteiro do dial anda até a frequência da banda.
import { p, pop, enter, move, lerp } from "../../tempo.mjs";
import { ufs } from "../../../mapa.mjs";
import { nomeUf } from "../../../voz.mjs";
import { mundo, caixaDe, enquadra, tela, caminho } from "../../mapa-comum.mjs";
import { gabinete, placa, visor, dial, label, luz, procura, freqDe, cabe, largAnton, esc, F_ANTON, F_INTER } from "./pecas.mjs";

const R = { x: 100, y: 560, w: 880, h: 760 };

export function cenaEstado(T, story, cor) {
  if (T < 5.5 || T >= 9) return "";
  const ufsShow = [...new Set(story.shows.map((s) => s.uf))];
  const estado = ufsShow.length > 1 ? ufsShow.join(" E ") : nomeUf(ufsShow[0]).toUpperCase();
  const pts = ufsShow.flatMap((uf) => (ufs()[uf] || []).flat().map(mundo));
  const cam = enquadra(caixaDe(pts), R, 2, 70);
  const liga = p(T, 5.55, 0.35, enter);
  const est = Object.entries(ufs()).map(([uf, polys]) => {
    const meu = ufsShow.includes(uf);
    return `<path d="${caminho(polys.map((q) => q.map((v) => tela(cam, mundo(v)))))}" fill="${cor.luz}" fill-opacity="${meu ? 0.32 * liga : 0.05}" stroke="${cor.luz}" stroke-opacity="${meu ? 0.95 : 0.3}" stroke-width="${meu ? 4 : 2}"/>`;
  }).join("");
  const cx = R.x + R.w / 2, cy = R.y + R.h / 2, raio = 640;
  const ang = ((T - 5.5) * 200) % 360, rad = (ang - 90) * Math.PI / 180, rad2 = (ang - 125) * Math.PI / 180;
  const varre = `<path d="M${cx},${cy} L${(cx + raio * Math.cos(rad2)).toFixed(1)},${(cy + raio * Math.sin(rad2)).toFixed(1)} A${raio},${raio} 0 0 1 ${(cx + raio * Math.cos(rad)).toFixed(1)},${(cy + raio * Math.sin(rad)).toFixed(1)} Z" fill="${cor.luz}" opacity="0.13"/>
    <path d="M${cx},${cy} L${(cx + raio * Math.cos(rad)).toFixed(1)},${(cy + raio * Math.sin(rad)).toFixed(1)}" stroke="${cor.luz}" stroke-width="4" opacity="0.8"/>`;
  const aneis = [140, 280, 420, 560].map((r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${cor.luz}" stroke-opacity="0.15" stroke-width="2"/>`).join("") +
    `<path d="M${R.x},${cy} L${R.x + R.w},${cy} M${cx},${R.y} L${cx},${R.y + R.h}" stroke="${cor.luz}" stroke-opacity="0.15" stroke-width="2"/>`;
  const pinos = story.shows.map((s, i) => {
    const [a, b] = tela(cam, mundo(s.lonlat)), k = p(T, 6.4 + i * 0.3, 0.35, pop);
    if (k <= 0) return "";
    const fase = ((T - 6.4 - i * 0.3) % 1.2) / 1.2;
    return `<circle cx="${a.toFixed(1)}" cy="${b.toFixed(1)}" r="${(16 + 70 * fase).toFixed(1)}" fill="none" stroke="${cor.luz}" stroke-width="4" opacity="${(0.8 * (1 - fase)).toFixed(3)}"/>
      <circle cx="${a.toFixed(1)}" cy="${b.toFixed(1)}" r="${(20 * k).toFixed(1)}" fill="${cor.luz}"/>`;
  }).join("");
  const tela2 = `<clipPath id="nrd"><rect x="${R.x}" y="${R.y}" width="${R.w}" height="${R.h}" rx="16"/></clipPath>
    ${visor(R.x, R.y, R.w, R.h, cor)}<g clip-path="url(#nrd)">${aneis}${est}${varre}${luz(pinos, 0.9)}</g>`;
  const fe = Math.min(130, 900 / largAnton(estado, 1)), opT = p(T, 5.7, 0.35, enter);
  const titulo = label("SINAL CAPTADO EM", 540, 320, cor, { f: 34, anc: "middle", fill: cor.rotulo, op: opT }) +
    `<text x="540" y="${(362 + fe * 0.98).toFixed(1)}" text-anchor="middle" font-family="${F_ANTON}" font-size="${fe.toFixed(1)}" fill="${cor.rotulo}" opacity="${opT.toFixed(3)}">${esc(estado)}</text>`;
  const cidades = story.shows.map((s) => s.cidade).join(" · ");
  const fq = freqDe(story.banda), fAgora = procura(T, 88 + ((fq - 80) % 20), fq, 5.6, 1.4);
  const baixo = placa(60, 1360, 960, 330, cor) + dial(T, { x: 90, y: 1390, w: 900, h: 150, freq: fAgora, cor, marcas: [{ f: fq }] }) +
    `<text x="540" y="${1630}" text-anchor="middle" font-family="${F_INTER}" font-size="${cabe(cidades, 880, 46).toFixed(1)}" fill="${cor.texto}" opacity="${p(T, 6.6, 0.3, enter).toFixed(3)}">${esc(cidades)}</text>`;
  return gabinete(cor) + titulo + tela2 + baixo +
    `<rect x="0" y="${lerp(1920, 0, p(T, 8.7, 0.3, move)).toFixed(1)}" width="1080" height="1920" fill="${cor.bg}"/>`;
}
