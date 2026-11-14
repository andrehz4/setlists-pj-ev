// Layout F, cenas 1 (abertura sobre o clipe, 0 a 3: painel sobe com o dia e o nome em pastilhas) e 2 (logo, 3 a 5.5:
// nome em fileira, logo que liga em degraus com varredura de linhas, DESDE em pastilhas, BASE e CONTA digitadas).
import { lerp } from "../../tempo.mjs";
import { pastilhas, texto, digitado, linhaDigitada, separador, caber, larg, pr, out, io, lin } from "./pastilhas.mjs";
import { modelo, quebrar } from "./modelo.mjs";

export function abertura(T, story, cor) {
  if (T >= 3) return "";
  const M = modelo(story), s = M.s1;
  const up = pr(T, 0, 0.3, out), sobe = pr(T, 2.6, 0.4, io), op = 1 - pr(T, 2.55, 0.25, io);
  const topo = lerp(lerp(1920, s.top, up), 0, sobe), opSelo = pr(T, 0.1, 0.2, out);
  const selo = `<rect x="60" y="250" width="420" height="56" fill="${cor.bg}" opacity="${opSelo.toFixed(3)}"/>` +
    texto(digitado(T, 0.15, "SMUFDPJ › AGENDA", 40).s, 78, 289, 30, cor.ch, { op: opSelo });
  const painel = topo < 1920
    ? `<rect x="0" y="${topo.toFixed(1)}" width="1080" height="${(1920 - topo).toFixed(1)}" fill="${cor.bg}"/>` : "";
  if (op <= 0) return selo + painel;
  const dia = pastilhas(T, { id: "f1h", txt: M.head1, cols: 20, x: 60, y: s.hy, tw: 40, gap: 8, start: 0.05,
    settle: (c) => 0.2 + c * 0.015, cor });
  const nome = s.lines.map((l, r) => pastilhas(T, { id: `f1n${r}`, txt: l, cols: s.cols, x: 60, y: s.ys[r], tw: s.tw, gap: s.gap,
    start: 0.1, settle: (c) => 0.25 + r * 0.1 + c * 0.03, cor })).join("");
  return selo + painel + `<g opacity="${op.toFixed(3)}">${dia}${nome}</g>`;
}

// sem logo: o nome da banda quebrado por palavras (até 5 linhas), no quadrado
function semLogo(story, cor) {
  const nome = String(story.banda || "").toUpperCase().trim();
  const l = [10, 12, 14, 18].map((c) => quebrar(nome, c, 5)).find(Boolean) || [nome];
  const F = Math.min(96, 400 / (l.length * 1.15), ...l.map((t) => caber(t, 400, 96))), passo = F * 1.15;
  const y0 = 620 - (l.length * passo) / 2 + F * 0.8;
  return l.map((t, i) => texto(t, 540, y0 + i * passo, F, cor.ch, { ancora: "middle" })).join("");
}

function logo(T, story, cor, logoUri) {
  const boot = Math.floor(pr(T, 3.15, 0.45, lin) * 12) / 12;
  const moldura = `<rect x="300" y="380" width="480" height="480" fill="none" stroke="${cor.ch}" stroke-width="3" ` +
    `opacity="${pr(T, 3.1, 0.1, lin).toFixed(3)}"/>`;
  if (boot <= 0) return moldura;
  const img = logoUri
    ? `<image href="${logoUri}" x="303" y="383" width="474" height="474" preserveAspectRatio="xMidYMid slice"/>`
    : semLogo(story, cor);
  return moldura + `<clipPath id="flogo"><rect x="303" y="383" width="474" height="${(474 * boot).toFixed(1)}"/></clipPath>
    <pattern id="fscan" width="6" height="6" patternUnits="userSpaceOnUse">
    <rect width="6" height="2" fill="${cor.bg}" fill-opacity="0.35"/></pattern>
    <g clip-path="url(#flogo)"><rect x="303" y="383" width="474" height="474" fill="${cor.tile}"/>${img}
    <rect x="303" y="383" width="474" height="474" fill="url(#fscan)"/></g>`;
}

// linhas DESDE / BASE / CONTA; a que faltar sai e as de baixo sobem
function ficha(T, story, cor) {
  const ano = story.desde ? String(story.desde) : "", conta = story.conta || "";
  const base = String(story.cidadeBase || "").toUpperCase();
  const rot = (t, y, at) => texto(t, 60, y, 30, cor.ch, { op: pr(T, at, 0.15, lin) });
  const contaN = digitado(T, 4.15, conta, 30).n;
  let y = 1000, s = "";
  if (ano) {
    const n = [...ano].length, tw = Math.min(88, Math.floor((720 + 8) / n) - 8);
    s += rot("DESDE", y, 3.6) + pastilhas(T, { id: "f2y", txt: ano, x: 300, y: y - 78, tw, gap: 8, start: 3.6,
      settle: (c) => 3.75 + c * 0.06, cor }) + separador(y + 80, pr(T, 3.7, 0.3, io), cor);
    y += 160;
  }
  if (base) {
    const F = Math.min(46, caber(base, 720, 46));
    s += rot("BASE", y, 3.8) + linhaDigitada(T, { t0: 3.85, txt: base, cps: 30, x: 300, y, F, cor,
      cursorLigado: () => T >= 3.85 && contaN === 0 }) + separador(y + 50, pr(T, 4.0, 0.3, io), cor);
    y += 130;
  }
  const F = Math.min(46, caber(conta, 720 - larg("_", 46), 46));
  return s + rot("CONTA", y, 4.1) +
    linhaDigitada(T, { t0: 4.15, txt: conta, cps: 30, x: 300, y, F, cor, cursorLigado: () => T >= 4.15 });
}

export function cenaLogo(T, story, cor, logoUri) {
  if (T < 3 || T >= 5.5) return "";
  const M = modelo(story);
  return `<rect width="1080" height="1920" fill="${cor.bg}"/>` +
    M.t2.lines.map((l, r) => pastilhas(T, { id: `f2n${r || ""}`, txt: l, x: 60, y: 250 + r * (Math.round(M.t2.tw * 1.4) + 6),
      tw: M.t2.tw, gap: M.t2.gap, start: 3.0, settle: (c) => 3.1 + r * 0.06 + c * 0.02, cor })).join("") +
    logo(T, story, cor, logoUri) + ficha(T, story, cor);
}
