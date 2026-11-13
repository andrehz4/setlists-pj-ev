// Layout I, cenas 3 (infográfico do mapa, 5.5 a 9), 4 (box de SERVIÇO, 9 a 12.5) e 5 (manchete final, 12.5 a 15).
import { p, pop, enter, move, lerp } from "../../tempo.mjs";
import { ufs } from "../../../mapa.mjs";
import { mundo, caixaDe, enquadra, tela, caminho, afastar } from "../../mapa-comum.mjs";
import { ufComPreposicao } from "../../../voz.mjs";
import { secao, cortina, fio, cabeAnton, esc, F_ANTON, F_INTER_XB, F_SERIF, F_PLAYFAIR } from "./pecas.mjs";
import { fundo } from "./cenas-capa.mjs";

const RM = { x: 60, y: 560, w: 960, h: 980 };
export function cenaMapa(T, story, cor) {
  if (T < 5.5 || T >= 9) return "";
  const ufsShow = [...new Set(story.shows.map((s) => s.uf))];
  const titulo = (ufsShow.length > 1 ? `OS SHOWS SÃO EM ${ufsShow.join(" E ")}` : `O SHOW É ${ufComPreposicao(ufsShow[0])}`).toUpperCase();
  const pts = ufsShow.flatMap((uf) => (ufs()[uf] || []).flat().map(mundo));
  const cam = enquadra(caixaDe(pts), RM, 2, 60), k = p(T, 5.6, 0.8, move);
  const estados = Object.entries(ufs()).map(([uf, polys]) => { const show = ufsShow.includes(uf);
    return `<path d="${caminho(polys.map((q) => q.map((v) => tela(cam, mundo(v)))))}" fill="${show ? "url(#hac)" : "none"}" stroke="${cor.tinta}" stroke-width="${show ? 4 : 2}" opacity="${show ? 1 : 0.35}"/>`; }).join("");
  const pos = story.shows.map((s) => tela(cam, mundo(s.lonlat))), desl = afastar(pos, 34, RM);
  const marcas = story.shows.map((s, i) => {
    const x = pos[i][0] + desl[i][0], y = pos[i][1] + desl[i][1], m = p(T, 6.7 + i * 0.3, 0.35, pop);
    if (m <= 0) return "";
    const nome = `${story.shows.length > 1 ? `${i + 1}. ` : ""}${s.cidade.toUpperCase()}`, f = 44, w = nome.length * 0.5 * f + 40;
    const N = story.shows.length, lx = N > 1 ? 60 : Math.min(Math.max(x - w / 2, 60), 1020 - w);
    const ly = N > 1 ? 1500 - (N - i) * 80 : y < 1050 ? y + 80 : y - 80 - 64;
    return `<circle cx="${x}" cy="${y}" r="${(30 * m).toFixed(1)}" fill="none" stroke="${cor.acento}" stroke-width="8"/>
      <line x1="${x}" y1="${y + (ly > y ? 30 : -30)}" x2="${N > 1 ? lx + w : lx + w / 2}" y2="${N > 1 ? ly + 32 : ly > y ? ly : ly + 64}" stroke="${cor.acento}" stroke-width="4" opacity="${m.toFixed(2)}"/>
      <g opacity="${m.toFixed(3)}"><rect x="${lx}" y="${ly}" width="${w}" height="64" fill="${cor.acento}"/>
      <text x="${lx + 20}" y="${ly + 50}" font-family="${F_ANTON}" font-size="${f}" fill="${cor.sobreAcento}">${esc(nome)}</text></g>`;
  }).join("");
  return fundo(cor) + secao("INFOGRÁFICO", 60, 260, cor) +
    cortina(p(T, 5.6, 0.45, move), 340, 160, `<text x="60" y="460" font-family="${F_ANTON}" font-size="${cabeAnton(titulo, 960, 120).toFixed(1)}" fill="${cor.tinta}">${esc(titulo)}</text>`) +
    `<g opacity="${k.toFixed(3)}">${estados}</g>` + marcas +
    `<text x="60" y="1600" font-family="${F_SERIF}" font-style="italic" font-size="34" fill="${cor.tinta}" opacity="${k.toFixed(3)}">Fonte: agenda do Só Mais um Fã</text>` +
    `<rect x="0" y="${lerp(1920, 0, p(T, 8.7, 0.3, move)).toFixed(1)}" width="1080" height="1920" fill="${cor.bg}"/>`;
}

const hora = (h) => (h ? String(h).replace(/^(\d{1,2}):?(\d{2})?$/, (_, a, b) => `${Number(a)}h${b && b !== "00" ? b : ""}`) : null);

export function cenaServico(T, story, cor) {
  if (T < 9 || T >= 12.5) return "";
  const N = story.shows.length, alto = Math.min(400, 1080 / N), y0 = 470;
  const box = p(T, 9.0, 0.35, enter);
  let out = fundo(cor) + `<rect x="60" y="300" width="960" height="${(alto * N + 200) * box}" fill="none" stroke="${cor.tinta}" stroke-width="6"/>
    <rect x="60" y="300" width="960" height="110" fill="${cor.tinta}"/><text x="100" y="385" font-family="${F_ANTON}" font-size="78" fill="${cor.bg}">SERVIÇO</text>
    <text x="980" y="380" text-anchor="end" font-family="${F_SERIF}" font-style="italic" font-size="46" fill="${cor.bg}">anote aí</text>`;
  story.shows.forEach((s, i) => {
    const y = y0 + i * alto, esc2 = Math.min(1, alto / 360), cidade = s.cidade.toUpperCase();
    const f = cabeAnton(cidade, 880, 120 * esc2), fl = 50 * esc2, h = hora(s.hora);
    const quando = h ? `Quando: hoje, a partir das ${h}` : "Quando: hoje (horário no perfil da banda)";
    const onde = s.casa ? `Onde: ${s.casa}` : `Mais: ${story.conta}`;
    out += cortina(p(T, 9.2 + i * 0.3, 0.45, move), y, alto, `<text x="100" y="${(y + f * 0.95).toFixed(1)}" font-family="${F_ANTON}" font-size="${f.toFixed(1)}" fill="${cor.acento}">${esc(cidade)}</text>
      <text x="100" y="${(y + f * 0.95 + fl * 1.35).toFixed(1)}" font-family="${F_SERIF}" font-size="${fl.toFixed(1)}" fill="${cor.tinta}">${esc(quando)}</text>
      <text x="100" y="${(y + f * 0.95 + fl * 2.55).toFixed(1)}" font-family="${F_SERIF}" font-size="${fl.toFixed(1)}" fill="${cor.tinta}">${esc(onde)}</text>
      ${i < N - 1 ? fio(100, y + alto - 24, 880, cor, 2) : ""}`);
  });
  return out;
}

export function cenaFinal(T, cor) {
  if (T < 12.5) return "";
  const linhas = ["COMPARTILHA", "COM QUEM VAI", "COM VOCÊ"], f = 200, y0 = 600;
  const manchete = linhas.map((l, i) => cortina(p(T, 12.6 + i * 0.12, 0.4, move), y0 + i * f * 1.12 - f * 1.02, f * 1.12, `<text x="60" y="${y0 + i * f * 1.12}" font-family="${F_ANTON}" font-size="${cabeAnton(l, 960, f).toFixed(1)}" fill="${cor.tinta}">${l}</text>`)).join("");
  const sm = p(T, 13.4, 0.35, pop);
  return fundo(cor) + `<text x="540" y="200" text-anchor="middle" font-family="${F_PLAYFAIR}" font-style="italic" font-weight="900" font-size="64" fill="${cor.tinta}">Só Mais um Fã</text>${fio(60, 226, 960, cor, 4)}` +
    secao("ÚLTIMA HORA", 60, 260, cor) + manchete +
    cortina(p(T, 13.1, 0.4, move), 1100, 140, `<text x="60" y="1160" font-family="${F_SERIF}" font-style="italic" font-size="50" fill="${cor.tinta}">Leia a agenda completa em</text>
      <text x="60" y="1220" font-family="${F_INTER_XB}" font-weight="800" font-size="40" fill="${cor.tinta}">somaisumfadepearljam.com.br/agenda</text>`) +
    (sm > 0 ? `<g transform="translate(540 1400) rotate(-4) scale(${lerp(1.6, 1, sm).toFixed(4)}) translate(-540 -1400)" opacity="${Math.min(1, sm * 1.5).toFixed(3)}">
      <rect x="140" y="1310" width="800" height="180" fill="none" stroke="${cor.acento}" stroke-width="10"/>
      <text x="540" y="1440" text-anchor="middle" font-family="${F_ANTON}" font-size="110" fill="${cor.acento}">SIGA @SMUFDPJ</text></g>` : "");
}
