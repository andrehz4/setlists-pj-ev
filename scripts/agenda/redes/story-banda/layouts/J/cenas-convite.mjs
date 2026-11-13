// Layout J, cenas 4 (convite com os shows de hoje, 9 a 12.5) e 5 (pedido de compartilhar digitado, 12.5 a 15).
import { p, pop, enter } from "../../tempo.mjs";
import { balao, topo, fundo, entra, larg, esc, F_INTER_XB, F_INTER } from "./pecas.mjs";

const hora = (h) => (h ? String(h).replace(/^(\d{1,2}):?(\d{2})?$/, (_, a, b) => `${a.padStart(2, "0")}:${b || "00"}`) : "--:--");

export function cenaConvite(T, story, cor) {
  if (T < 9 || T >= 12.5) return "";
  const N = story.shows.length, alto = Math.min(300, 960 / N), hM = 120 + N * alto + 130;
  const linhas = (x, y) => {
    let s = `<text x="${x + 40}" y="${y + 70}" font-family="${F_INTER_XB}" font-weight="800" font-size="60" fill="${cor.texto}">Shows de hoje</text>
      <rect x="${x + 40}" y="${y + 100}" width="780" height="3" fill="${cor.apoio}" opacity="0.4"/>`;
    story.shows.forEach((sh, i) => {
      const yy = y + 120 + i * alto, op = entra(T, 9.25 + i * 0.3), esc2 = Math.min(1.3, alto / 230);
      const cidade = sh.cidade, fc = Math.min(58 * esc2, 560 / larg(cidade, 1));
      s += `<g opacity="${op.toFixed(3)}" transform="translate(${((1 - op) * 60).toFixed(1)} 0)">
        <text x="${x + 40}" y="${(yy + 90 * esc2).toFixed(1)}" font-family="${F_INTER_XB}" font-weight="800" font-size="${(64 * esc2).toFixed(1)}" fill="${cor.acento}">${hora(sh.hora)}</text>
        <text x="${x + 260 * esc2 + 40}" y="${(yy + 72 * esc2).toFixed(1)}" font-family="${F_INTER_XB}" font-weight="800" font-size="${fc.toFixed(1)}" fill="${cor.texto}">${esc(cidade)}</text>
        <text x="${x + 260 * esc2 + 40}" y="${(yy + 128 * esc2).toFixed(1)}" font-family="${F_INTER}" font-size="${Math.min(38 * esc2, 520 / larg(sh.casa || "horário no perfil da banda", 1)).toFixed(1)}" fill="${cor.apoio}">${esc(sh.casa || "horário no perfil da banda")}</text></g>`;
    });
    const kb = p(T, 10.4, 0.35, pop), yb = y + 120 + N * alto + 20;
    return s + (kb > 0 ? `<g transform="translate(${x + 430} ${yb + 45}) scale(${kb.toFixed(3)}) translate(${-(x + 430)} ${-(yb + 45)})"><rect x="${x + 40}" y="${yb}" width="780" height="90" rx="45" fill="${cor.eu}"/>
      <text x="${x + 430}" y="${yb + 60}" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="40" fill="${cor.textoEu}">EU VOU</text></g>` : "");
  };
  const card = balao(T, { lado: "outro", y: 400, at: 9.05, cor, w: 860, hMiolo: hM, miolo: linhas });
  const resp = balao(T, { lado: "eu", y: 400 + card.h + 30, at: 11.3, cor, texto: "fechou, te vejo lá", f: 60 });
  return fundo(cor) + topo(cor, "você, Bia e mais 12") + card.svg + resp.svg;
}

export function cenaFinal(T, cor) {
  if (T < 12.5) return "";
  const titulo = ["Compartilha", "com quem vai", "com você"].map((l, i) => {
    const k = p(T, 12.55 + i * 0.1, 0.35, pop);
    return k > 0 ? `<text x="60" y="${560 + i * 150}" font-family="${F_INTER_XB}" font-weight="800" font-size="140" fill="${i === 0 ? cor.acento : cor.texto}" opacity="${Math.min(1, k * 2).toFixed(3)}" transform="translate(0 ${((1 - k) * 40).toFixed(1)})">${l}</text>` : "";
  }).join("");
  const site = "somaisumfadepearljam.com.br/agenda", n = Math.round(site.length * Math.min(1, Math.max(0, (T - 12.9) / 0.9)));
  const cursor = Math.floor(T * 3) % 2 === 0 && n < site.length ? "|" : "";
  const enviado = p(T, 14.0, 0.35, pop);
  const siga = p(T, 13.4, 0.35, pop);
  return fundo(cor) + topo(cor, "encaminhe pra turma") + titulo +
    (siga > 0 ? `<g transform="translate(540 1110) scale(${siga.toFixed(3)}) translate(-540 -1110)"><rect x="60" y="1050" width="960" height="120" rx="60" fill="${cor.acento}"/>
      <text x="540" y="1130" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="56" fill="${cor.topo}">Siga @smufdpj</text></g>` : "") +
    `<rect x="40" y="1420" width="840" height="110" rx="55" fill="${cor.topo}"/>
    <text x="90" y="1490" font-family="${F_INTER}" font-size="${Math.min(40, 760 / larg(site, 1)).toFixed(1)}" fill="${cor.texto}">${esc(site.slice(0, n))}${cursor}</text>
    <circle cx="960" cy="1475" r="${(55 * (1 + 0.15 * enviado * (1 - enviado) * 4)).toFixed(1)}" fill="${cor.eu}"/>
    <path d="M935,1450 L990,1475 L935,1500 L945,1475 Z" fill="${cor.textoEu}"/>` +
    (enviado > 0 ? `<text x="1020" y="1580" text-anchor="end" font-family="${F_INTER_XB}" font-weight="800" font-size="34" fill="${cor.apoio}" opacity="${enviado.toFixed(3)}">enviado</text>` : "");
}
