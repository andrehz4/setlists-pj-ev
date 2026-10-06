// Cenas de texto do story por banda: título (abertura, depois encolhe pro canto), logo e final (MOTION-SPEC-banda).
import { p, pop, enter, move, lerp } from "./tempo.mjs";
import { COR, esc, etiqueta, quebrarNome, F_ANTON, F_INTER_XB, F_PLAYFAIR } from "./pecas.mjs";

const SEMANA = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];

// Bloco do título: altura e topo centrado entre y 440 e 1640.
export function blocoTitulo(story) {
  const { linhas, f } = quebrarNome(story.banda);
  const n = linhas.length;
  const Hb = 202 + 20 + n * (f + 32) + (n - 1) * 14 + 30 + 76;
  return { linhas, f, n, Hb, y0: 440 + (1200 - Hb) / 2 };
}

export function titulo(T, story, cor) {
  const { linhas, f, n, Hb, y0 } = blocoTitulo(story);
  const d = new Date(`${story.dia}T12:00:00Z`);
  const N = story.shows.length;
  const data = `${SEMANA[d.getUTCDay()]} ${story.dia.slice(8)}/${story.dia.slice(5, 7)}${N > 1 ? ` · ${N} SHOWS` : ""}`;
  const rots = [1.5, -1, 2];
  const nome = linhas.map((l, i) => etiqueta(T, { texto: l, f, x: 60 + (i % 2) * 24, y: y0 + 222 + i * (f + 46),
    fundo: cor.strip, cor: COR.creme, rot: rots[i], at: 0.7 + i * 0.3 })).join("");
  const rev = p(T, 0.85 + n * 0.3, 0.45, enter);
  const faixa = rev > 0 ? `<clipPath id="rv"><rect x="60" y="${y0 + Hb - 76}" width="${960 * rev}" height="76"/></clipPath>
    <g clip-path="url(#rv)"><rect x="60" y="${y0 + Hb - 76}" width="960" height="76" fill="${COR.tinta}"/>
    <text x="90" y="${y0 + Hb - 24}" font-family="${F_INTER_XB}" font-weight="800" font-size="38" letter-spacing="1.5" fill="${COR.creme}">${esc(data)}</text></g>` : "";
  // encolhe pro canto: caixa 470x330 (T 2.9) e depois 330x190 (T 9.0)
  const s2 = Math.min(470 / 960, 330 / Hb), s4 = Math.min(330 / 960, 190 / Hb);
  const a = p(T, 2.9, 0.7, move), b = p(T, 9.0, 0.7, move);
  const s = lerp(lerp(1, s2, a), s4, b);
  const tx = 60 - 60 * s, ty = lerp(lerp(0, 240 - y0 * s2, a), 240 - y0 * s4, b);
  return `<g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${s.toFixed(4)})">
  ${etiqueta(T, { texto: "HOJE TEM", f: 170, x: 60, y: y0, fundo: COR.creme, cor: COR.tinta, rot: -2, at: 0.3 })}${nome}${faixa}</g>`;
}

export function logo(T, story, logoUri) {
  if (T < 3.0 || T > 5.9) return "";
  const sai = p(T, 5.5, 0.35, enter);
  const ent = p(T, 3.3, 0.45, pop), op = p(T, 3.3, 0.12, enter);
  const quadro = `<g opacity="${op.toFixed(3)}" transform="translate(540 880) rotate(${lerp(-8, -2, ent).toFixed(2)}) scale(${lerp(0.6, 1, ent).toFixed(4)}) translate(-260 -260)">
    <rect x="-8" y="-8" width="536" height="536" fill="${COR.creme}"/><rect width="520" height="520" fill="#141210"/>
    ${logoUri ? `<image href="${logoUri}" x="8" y="8" width="504" height="504" preserveAspectRatio="xMidYMid slice"/>` : `<text x="260" y="300" text-anchor="middle" font-family="${F_ANTON}" font-size="130" fill="${COR.creme}">LOGO</text>`}
    <rect x="-50" y="-30" width="170" height="46" fill="${COR.papel}" opacity="0.92" transform="rotate(-38 35 -7)"/>
    <rect x="400" y="-30" width="170" height="46" fill="${COR.papel}" opacity="0.92" transform="rotate(36 485 -7)"/></g>`;
  const at = p(T, 3.55, 0.35, enter);
  const arroba = `<text x="540" y="${1230 - 20 * at}" opacity="${at.toFixed(3)}" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="50" fill="${COR.creme}">${esc(story.conta)}</text>`;
  const desde = etiqueta(T, { texto: `DESDE ${story.desde}`, f: 110, x: 540, y: 1270, fundo: COR.creme, cor: COR.tinta, rot: -1.5, at: 3.8, ancora: "centro" });
  const oc = p(T, 4.05, 0.35, enter);
  const origem = `<g opacity="${oc.toFixed(3)}"><circle cx="${540 - (story.cidadeBase.length * 12) - 30}" cy="1462" r="14" fill="${COR.pin}" stroke="${COR.creme}" stroke-width="4"/>
    <text x="${540 + 10}" y="1476" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="40" fill="${COR.creme}">${esc(story.cidadeBase)}</text></g>`;
  return `<g opacity="${(1 - sai).toFixed(3)}" transform="translate(540 1000) scale(${(1 - 0.15 * sai).toFixed(4)}) translate(-540 -1000)">${quadro}${arroba}${desde}${origem}</g>`;
}

// Final: papel creme com borda rasgada sobe e cobre tudo.
export function final(T, cor) {
  const sobe = p(T, 12.35, 0.5, move);
  if (sobe <= 0) return "";
  const topo = lerp(1960, 0, sobe);
  let dentes = `M0 ${topo + 30}`;
  for (let x = 0; x <= 1080; x += 40) dentes += ` L${x + 20} ${topo + (x / 40) % 2 * 18} L${x + 40} ${topo + 30}`;
  const linha = (t, y, r, at) => { const o = p(T, at, 0.3, enter); return `<text x="60" y="${y}" opacity="${o.toFixed(3)}" transform="rotate(${r} 60 ${y})" font-family="${F_ANTON}" font-size="160" fill="${COR.tinta}">${t}</text>`; };
  const url = p(T, 13.35, 0.4, enter), siga = p(T, 13.55, 0.3, pop), so = p(T, 13.55, 0.08, enter);
  return `<path d="${dentes} L1080 1920 L0 1920 Z" fill="${COR.papel}"/>
  <text x="540" y="380" opacity="${p(T, 12.7, 0.4, enter).toFixed(3)}" text-anchor="middle" font-family="${F_PLAYFAIR}" font-style="italic" font-weight="900" font-size="64" fill="${COR.tinta}">Só Mais um Fã de PEARL JAM</text>
  ${linha("COMPARTILHA", 680, -1.5, 12.85)}${linha("COM QUEM VAI", 885, 0.5, 12.97)}${linha("COM VOCÊ", 1095, -1, 13.09)}
  <clipPath id="ur"><rect x="60" y="1180" width="${980 * url}" height="140"/></clipPath>
  <g clip-path="url(#ur)" transform="rotate(-1.5 540 1248)"><rect x="60" y="1200" width="960" height="96" fill="${cor.strip}"/>
  <text x="540" y="1264" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="44" fill="${COR.creme}">somaisumfadepearljam.com.br/agenda</text></g>
  <g opacity="${so.toFixed(3)}" transform="translate(540 1425) rotate(1) scale(${lerp(1.4, 1, siga).toFixed(4)}) translate(-480 -75)">
  <rect width="960" height="150" fill="${COR.tinta}"/>
  <text x="480" y="112" text-anchor="middle" font-family="${F_ANTON}" font-size="104"><tspan fill="${COR.creme}">SIGA</tspan><tspan dx="34" fill="${cor.strip}">@smufdpj</tspan></text></g>`;
}
