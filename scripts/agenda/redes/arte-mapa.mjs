// Story "mapa do dia" (1080x1920): mapa enquadrado na região dos shows de hoje, um pino numerado por cidade
// (pinos que ficariam um em cima do outro se afastam, com um fio até o ponto certo) e a lista embaixo:
// cidade + @ das bandas. Mini Brasil no canto mostra onde fica o recorte.
import "../../publish/fontconfig-boot.mjs";
import { F_ANTON, F_INTER_SB, F_INTER_XB, F_PLAYFAIR } from "../../publish/fontconfig-boot.mjs";
import { escapeXml as esc } from "../../publish/slide/base.mjs";
import { cidadesDoDia, projecao, caminhosUf, ufs, centroUf } from "./mapa.mjs";

const W = 1080, H = 1920, R = 26;
const MAPA = { x: 40, y: 560, w: 1000, h: 700 };
const SEMANA = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
const { default: sharp } = await import("sharp");

// Afasta pinos sobrepostos (iterações simples de repulsão), sem sair do quadro do mapa.
export function afastar(pts, raio = R) {
  const p = pts.map(([x, y]) => [x, y]);
  for (let it = 0; it < 80; it++) {
    for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) {
      const dx = p[j][0] - p[i][0], dy = p[j][1] - p[i][1], d = Math.hypot(dx, dy) || 0.01, min = raio * 2 + 6;
      if (d >= min) continue;
      const m = (min - d) / 2, ux = d > 0.01 ? dx / d : 1, uy = d > 0.01 ? dy / d : 0;
      p[i][0] -= ux * m; p[i][1] -= uy * m; p[j][0] += ux * m; p[j][1] += uy * m;
    }
    for (const q of p) {
      q[0] = Math.min(MAPA.x + MAPA.w - raio - 4, Math.max(MAPA.x + raio + 4, q[0]));
      q[1] = Math.min(MAPA.y + MAPA.h - raio - 4, Math.max(MAPA.y + raio + 4, q[1]));
    }
  }
  return p;
}

function miniBrasil(cidades, proj) {
  const box = { x: MAPA.x + MAPA.w - 196, y: MAPA.y + 16, w: 180, h: 180 };
  const todos = Object.values(ufs()).flat(2);
  const pm = projecao([[Math.min(...todos.map((p) => p[0])), Math.min(...todos.map((p) => p[1]))],
    [Math.max(...todos.map((p) => p[0])), Math.max(...todos.map((p) => p[1]))]], { ...box, folga: 0.5, minimo: 1 });
  const contorno = caminhosUf(pm).map((c) => `<path d="${c.d}" fill="#fff" fill-opacity="0.18"/>`).join("");
  const pontos = cidades.map((c) => { const [x, y] = pm(c.pos); return `<circle cx="${x}" cy="${y}" r="4" fill="#E10600"/>`; }).join("");
  return `<rect x="${box.x - 8}" y="${box.y - 8}" width="${box.w + 16}" height="${box.h + 16}" fill="#14213a" fill-opacity="0.92"/>${contorno}${pontos}`;
}

export function svgMapa(shows, dia, cor = "#2a5b9e") {
  const cidades = cidadesDoDia(shows);
  const proj = projecao(cidades.map((c) => c.pos), MAPA);
  const comShow = new Set(cidades.map((c) => c.uf));
  // mar escuro, terra clara, estado com show mais claro ainda; sigla de cada estado que aparece no recorte
  const estados = caminhosUf(proj).map((c) => `<path d="${c.d}" fill="${comShow.has(c.uf) ? "#ede4cc" : "#ede4cc"}" fill-opacity="${comShow.has(c.uf) ? 0.42 : 0.16}" stroke="#fff" stroke-opacity="0.55" stroke-width="1.5"/>`).join("");
  const siglas = Object.keys(ufs()).map((uf) => {
    const [sx, sy] = proj(centroUf(uf));
    const noMini = sx > MAPA.x + MAPA.w - 230 && sy < MAPA.y + 240; // não escreve por baixo do mini Brasil
    const dentro = !noMini && sx > MAPA.x + 30 && sx < MAPA.x + MAPA.w - 30 && sy > MAPA.y + 30 && sy < MAPA.y + MAPA.h - 20;
    return dentro ? `<text x="${sx}" y="${sy}" text-anchor="middle" font-family="${F_ANTON}" font-size="40" fill="#fff" opacity="${comShow.has(uf) ? 0.55 : 0.3}">${uf}</text>` : "";
  }).join("");
  const reais = cidades.map((c) => proj(c.pos));
  const pinos = afastar(reais);
  const marcas = pinos.map(([x, y], i) => `<line x1="${reais[i][0]}" y1="${reais[i][1]}" x2="${x}" y2="${y}" stroke="#fff" stroke-width="2.5"/>
    <circle cx="${reais[i][0]}" cy="${reais[i][1]}" r="6" fill="#fff"/>
    <circle cx="${x}" cy="${y}" r="${R}" fill="#E10600" stroke="#fff" stroke-width="4"/>
    <text x="${x}" y="${y + 11}" text-anchor="middle" font-family="${F_ANTON}" font-size="32" fill="#fff">${i + 1}</text>`).join("\n");
  const max = 5, passo = 100, y0 = 1340;
  const lista = cidades.slice(0, max).map((c, i) => {
    const y = y0 + i * passo;
    const bandas = [...new Set(c.shows.map((s) => `@${s.banda}`))].join("  ·  ");
    return `<circle cx="110" cy="${y - 14}" r="${R}" fill="#E10600"/>
    <text x="110" y="${y - 3}" text-anchor="middle" font-family="${F_ANTON}" font-size="32" fill="#fff">${i + 1}</text>
    <text x="160" y="${y}" font-family="${F_ANTON}" font-size="48" fill="#fff">${esc(`${c.cidade}/${c.uf}`.toUpperCase())}</text>
    <text x="160" y="${y + 40}" font-family="${F_INTER_SB}" font-size="30" fill="#fff" opacity="0.85">${esc(bandas)}</text>`;
  }).join("\n");
  const resto = cidades.length > max ? `<text x="160" y="${y0 + max * passo}" font-family="${F_INTER_SB}" font-size="30" fill="#fff" opacity="0.8">+ ${cidades.length - max} cidade(s) na agenda do site</text>` : "";
  const d = new Date(`${dia}T12:00:00Z`);
  const total = shows.length, nc = cidades.length;
  const sub = `${SEMANA[d.getUTCDay()]} ${dia.slice(8)}/${dia.slice(5, 7)}  ·  ${total} SHOW${total > 1 ? "S" : ""} EM ${nc} CIDADE${nc > 1 ? "S" : ""}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${cor}"/><rect width="${W}" height="${H}" fill="#000" opacity="0.32"/>
  <text x="${W / 2}" y="120" text-anchor="middle" font-family="${F_PLAYFAIR}" font-style="italic" font-weight="900" font-size="42" fill="#fff">Só Mais um Fã de PEARL JAM</text>
  <text x="70" y="300" font-family="${F_ANTON}" font-size="132" fill="#fff">HOJE TEM</text>
  <text x="70" y="430" font-family="${F_ANTON}" font-size="104" fill="#fff">PEARL JAM COVER</text>
  <rect x="70" y="462" width="${W - 140}" height="70" fill="#E10600"/>
  <text x="${W / 2}" y="510" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="34" fill="#fff" letter-spacing="2">${esc(sub)}</text>
  <clipPath id="q"><rect x="${MAPA.x}" y="${MAPA.y}" width="${MAPA.w}" height="${MAPA.h}"/></clipPath>
  <rect x="${MAPA.x}" y="${MAPA.y}" width="${MAPA.w}" height="${MAPA.h}" fill="#000" fill-opacity="0.35"/>
  <g clip-path="url(#q)">${estados}${siglas}</g>
  <rect x="${MAPA.x}" y="${MAPA.y}" width="${MAPA.w}" height="${MAPA.h}" fill="none" stroke="#fff" stroke-opacity="0.3" stroke-width="2"/>
  ${miniBrasil(cidades, proj)}
  ${marcas}
  ${lista}
  ${resto}
  <text x="${W / 2}" y="${H - 70}" text-anchor="middle" font-family="${F_INTER_SB}" font-size="30" fill="#fff" opacity="0.85">agenda completa: somaisumfadepearljam.com.br/agenda</text>
</svg>`;
}

export async function gerarArteMapa(shows, dia, destino, cor) {
  await sharp(Buffer.from(svgMapa(shows, dia, cor))).jpeg({ quality: 90, mozjpeg: true }).toFile(destino);
  return destino;
}
