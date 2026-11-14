// Layout Z, cenas 4 (9 a 12.5: um traço de luz contínuo liga os shows como um caminho; cada nó acende e mostra
// cidade, hora e @casa) e 5 (12.5 a 15: a chamada escrita em luz, laço em volta do "Siga @smufdpj" e o link).
import { p } from "../../tempo.mjs";
import { novaCamada, pinta, trilha, luz, lanterna, brilhante, escreve, fundo, txt, cabe, largura, claro } from "./pecas.mjs";
import { rabisco, laco, caminhoEntre } from "./gestos.mjs";
import { exif, dataCurta } from "./cenas-capa.mjs";
import { anel } from "./cenas-mapa.mjs";

const linear = (u) => u;
const hora = (h) => (h ? String(h).replace(/^(\d{1,2}):?(\d{2})?$/, (_, a, b) => `${Number(a)}h${b && b !== "00" ? b : ""}`) : "");
const XN = 170, XT = 240, WT = 1080 - XT - 90;

export function cenaShows(T, story, cor) {
  if (T < 9 || T >= 12.5) return "";
  const N = story.shows.length, alto = Math.min(330, 860 / N), c = novaCamada();
  const ys = story.shows.map((_, i) => 1060 - ((N - 1) * alto) / 2 + i * alto);
  // nós reais intercalados com pontos que arqueiam pra esquerda (o traço respira entre um show e outro)
  const nos = ys.flatMap((y, i) => (i ? [[70, (ys[i - 1] + y) / 2], [XN, y]] : [[XN, y]]));
  const { pts, idx } = caminhoEntre(nos, [-80, ys[0] - 300], [100, 1990]), tr = trilha(pts);
  const dur = 0.7 + N * 0.6, k = p(T, 9.15, dur, linear);
  luz(c, tr, cor.luzes[0], k, { w: 0.8, semente: 21 });
  escreve(c, T, 9.05, 0.5, 540, 400, "SHOWS DE HOJE", cabe("SHOWS DE HOJE", 860, 104, "marker", 3), cor.texto, cor.luzes[1], { fonte: "marker", ls: 3 });
  c.nitido += txt(540, 474, dataCurta(story.dia), 34, cor.texto, { fonte: "interXB", ls: 5, op: 0.8 * p(T, 9.4, 0.4) });
  story.shows.forEach((sh, i) => {
    const fr = tr.fracao(idx[i * 2]), kt = p(T, 9.15 + fr * dur, 0.35), y = ys[i];
    if (kt <= 0) return;
    const lc = cor.luzes[i % 3];
    c.nitido += lanterna(XN, y, lc, 60 + i, 0.75 * kt);
    anel(c, XN, y, i + 1, cor, lc, Math.min(1, kt * 1.2), 28);
    const fc = cabe(sh.cidade, WT, 92, "anton", 1), base = y + fc * 0.36;
    brilhante(c, XT + 20 * (1 - kt), base, sh.cidade.toUpperCase(), fc, cor.texto, lc, { fonte: "anton", anchor: "start", ls: 1, op: kt });
    const hh = hora(sh.hora) || "ver perfil", casa = sh.casa || "";
    let fh = 46; const sep = casa ? "   " : "";
    while (fh > 26 && largura(hh, fh, "interXB") + largura(sep + casa, fh * 0.9, "interB") > WT) fh -= 2;
    const wh = largura(hh, fh, "interXB"), yl = base + 26 + fh;
    brilhante(c, XT, yl, hh, fh, claro(cor.acento, 0.35), cor.acento, { fonte: "interXB", anchor: "start", op: kt });
    if (casa) c.nitido += txt(XT + wh + largura(sep, fh * 0.9, "interB"), yl, casa, fh * 0.9, cor.texto, { fonte: "interB", anchor: "start", op: 0.85 * kt });
  });
  return fundo(T, cor) + exif(cor) + pinta(c);
}

export function cenaFinal(T, story, cor) {
  if (T < 12.5) return "";
  const l = ["COMPARTILHA", "COM QUEM VAI", "COM VOCÊ"], c = novaCamada(), site = "somaisumfadepearljam.com.br/agenda";
  const f = Math.min(...l.map((t) => cabe(t, 880, 130, "marker", 2)));
  [[31, -80, 330, 1160, 250, 50, 2, 12.5, 1.6, 0.55], [33, 1160, 1640, -80, 1760, 80, 3, 12.7, 1.6, 0.6]].forEach(([s, x0, y0, x1, y1, a, i, at, d, w]) =>
    luz(c, trilha(rabisco(s, x0, y0, x1, y1, a)), cor.luzes[i], p(T, at, d, linear), { w, op: 0.7, semente: s }));
  l.forEach((t, i) => escreve(c, T, 12.6 + i * 0.36, 0.36, 540, 560 + i * f * 1.18, t, f, cor.texto, cor.luzes[i % 3], { fonte: "marker", ls: 2 }));
  const ys = 1190, fs = cabe("Siga @smufdpj", 700, 110, "anton", 1), ws = largura("Siga @smufdpj", fs, "anton", 1);
  brilhante(c, 540, ys, "Siga @smufdpj", fs, cor.texto, cor.luzes[0], { fonte: "anton", ls: 1, op: p(T, 13.7, 0.35) });
  luz(c, trilha(laco(540, ys - fs * 0.38, ws / 2 + 70, fs * 0.82, 5)), cor.luzes[1], p(T, 13.75, 0.8, linear), { w: 0.6, semente: 41 });
  c.nitido += txt(540, 1420, site, cabe(site, 860, 42, "interB"), cor.texto, { fonte: "interB", op: 0.9 * p(T, 14.1, 0.4) });
  return fundo(T, cor) + pinta(c);
}
