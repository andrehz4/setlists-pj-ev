// Layout Z, cena 3 (5.5 a 9): uma lanterna desenha o contorno do estado no escuro; as cidades são pontos que acendem
// (clarão + anel numerado) e a lista numerada aparece embaixo.
import { p, pop, enter } from "../../tempo.mjs";
import { ufs } from "../../../mapa.mjs";
import { mundo, caixaDe, enquadra, tela, caminho, afastar } from "../../mapa-comum.mjs";
import { nomeUf } from "../../../voz.mjs";
import { novaCamada, pinta, trilha, luz, lanterna, brilhante, fundo, txt, cabe, largura, novoId, f1, op3, claro } from "./pecas.mjs";
import { exif } from "./cenas-capa.mjs";

const F = { x: 100, y: 560, w: 880, h: 780 };
const comprimento = (q) => q.reduce((a, v, i) => (i ? a + Math.hypot(v[0] - q[i - 1][0], v[1] - q[i - 1][1]) : 0), 0);

// anel numerado (número nítido sobre fundo escuro, anel de luz em volta)
export function anel(c, x, y, n, cor, luzCor, s = 1, R = 25) {
  if (s <= 0) return;
  c.fino += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(R * s)}" fill="none" stroke="${luzCor}" stroke-width="6"/>`;
  c.nitido += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(R * s)}" fill="#000" fill-opacity="0.75" stroke="${claro(luzCor, 0.6)}" stroke-width="2.4"/>` +
    txt(x, y + R * 0.42 * s, String(n), R * 1.12 * s, cor.texto, { fonte: "anton" });
}

export function cenaMapa(T, story, cor) {
  if (T < 5.5 || T >= 9) return "";
  const ufsShow = [...new Set(story.shows.map((s) => s.uf))], c = novaCamada();
  const estado = ufsShow.length > 1 ? ufsShow.join(" e ") : nomeUf(ufsShow[0]);
  const cam = enquadra(caixaDe(ufsShow.flatMap((uf) => (ufs()[uf] || []).flat().map(mundo))), F, 2, 70);
  const proj = (uf) => (ufs()[uf] || []).map((q) => q.map((v) => tela(cam, mundo(v))));
  const k = p(T, 5.75, 1.6, enter), m = novoId("zm"), mg = novoId("zn");
  const vizinhos = Object.keys(ufs()).filter((uf) => !ufsShow.includes(uf))
    .map((uf) => `<path d="${caminho(proj(uf))}" fill="none" stroke="${cor.texto}" stroke-width="1.2" stroke-dasharray="2 7" opacity="0.22"/>`).join("");
  const meus = ufsShow.flatMap(proj).filter((q) => comprimento(q) > 60);
  const maior = meus.reduce((a, q) => (comprimento(q) > comprimento(a) ? q : a), meus[0] || []);
  meus.forEach((q, i) => luz(c, trilha([...q, q[0]]), cor.luzes[0], k, { w: 0.8, cabeca: q === maior, semente: 3 + i }));
  const preenche = ufsShow.map((uf) => `<path d="${caminho(proj(uf))}" fill="${cor.luzes[0]}" opacity="${op3(0.08 * k)}"/>`).join("");
  // pinos: clarão no ponto real; anel deslocado se dois ficariam um em cima do outro
  const reais = story.shows.map((s) => tela(cam, mundo(s.lonlat))), desl = afastar(reais, 27, F);
  story.shows.forEach((s, i) => {
    const kp = p(T, 7.1 + i * 0.3, 0.4, pop), [x, y] = reais[i], [ax, ay] = [x + desl[i][0], y + desl[i][1]];
    if (kp <= 0) return;
    c.nitido += lanterna(x, y, cor.luzes[i % 3], 40 + i, Math.min(1, kp) * 0.9);
    if (Math.hypot(desl[i][0], desl[i][1]) > 4) c.nitido += `<path d="M${f1(x)},${f1(y)} L${f1(ax)},${f1(ay)}" stroke="${claro(cor.luzes[i % 3], 0.5)}" stroke-width="1.5" opacity="${op3(kp)}"/>`;
    anel(c, ax, ay, i + 1, cor, cor.luzes[i % 3], Math.min(1.1, kp));
  });
  const fE = cabe(estado, 860, 112, "anton", 2);
  brilhante(c, 540, 470, estado.toUpperCase(), fE, cor.texto, cor.luzes[0], { fonte: "anton", ls: 2, op: p(T, 5.6, 0.4) });
  // lista numerada: bloco centrado pela linha mais larga (medida real)
  const fL = Math.min(44, ...story.shows.map((s) => cabe(s.cidade, 760, 44, "interB"))), wMax = Math.max(...story.shows.map((s) => 70 + largura(s.cidade, fL, "interB")));
  story.shows.forEach((s, i) => { const y = F.y + F.h + 100 + i * 72, x0 = 540 - wMax / 2, kl = p(T, 7.4 + i * 0.3, 0.4);
    anel(c, x0 + 22, y - fL * 0.36, i + 1, cor, cor.luzes[i % 3], 0.86 * kl);
    c.nitido += txt(x0 + 70, y, s.cidade, fL, cor.texto, { fonte: "interB", anchor: "start", op: kl }); });
  const mascara = `<radialGradient id="${mg}" cx="0.5" cy="0.5" r="0.62"><stop offset="0.55" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
    <mask id="${m}"><rect x="${F.x}" y="${F.y}" width="${F.w}" height="${F.h}" fill="url(#${mg})"/></mask>`;
  return fundo(T, cor) + exif(cor) + txt(540, 340, "O show é em", 46, cor.texto, { fonte: "inter", op: 0.82 * p(T, 5.5, 0.3) }) +
    mascara + `<g mask="url(#${m})" opacity="${op3(p(T, 5.6, 0.5))}">${vizinhos}</g>${preenche}` + pinta(c);
}
