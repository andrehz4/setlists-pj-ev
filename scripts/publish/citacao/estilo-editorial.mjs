// Estilo "editorial" (Claude Design 1c + seta 3d, aprovado em 2026-09-30):
// moldura fina, @smufdpj cortando a linha de cima, citação em itálico
// centralizada, nome em caixa alta espaçada, contexto em itálico e o círculo
// (foto ou iniciais) cortando a linha de baixo. "ARRASTE" em pé + selo com
// seta cortando a linha direita. Coordenadas em px do slide 1080x1350.

import { esc, medir, encaixar, iniciais, F_PF_ITALICO, F_ASPAS, F_INTER } from "./texto.mjs";

const W = 1080, H = 1350;
const C = { cx: 540, cy: 1130, r: 110 };

export async function svgEditorial({ quote, autor, linhaContexto, pal, fotoUri }) {
  const { bg, accent, claro, apagado } = pal;
  const fonteQ = { family: F_PF_ITALICO, style: "italic", weight: 400 };
  const fit = await encaixar(quote, { maxW: 800, maxH: 580, fsMax: 84, fsMin: 44, lh: 1.18, fonte: fonteQ });
  const lh = fit.fs * 1.18;
  const y0 = 220 + (580 - fit.linhas.length * lh) / 2 + lh * 0.78;
  const linhas = fit.linhas.map((l, i) => `<tspan x="540" y="${Math.round(y0 + i * lh)}">${esc(l)}</tspan>`).join("");

  const tagW = (await medir("@smufdpj", { size: 28, weight: 700 })) + 52;
  const nome = autor.nome.toUpperCase();
  let fsNome = 30;
  while (fsNome > 22 && (await medir(nome, { size: fsNome, weight: 700, spacing: fsNome * 0.24 })) > 880) fsNome -= 2;
  let fsCtx = 34;
  while (linhaContexto && fsCtx > 24 && (await medir(linhaContexto, { ...fonteQ, size: fsCtx })) > 880) fsCtx -= 2;
  const arrasteH = await medir("ARRASTE", { size: 22, weight: 700, spacing: 6.6 });

  const circulo = fotoUri
    ? `<clipPath id="cf"><circle cx="${C.cx}" cy="${C.cy}" r="${C.r}"/></clipPath>
  <image href="${fotoUri}" x="${C.cx - C.r}" y="${C.cy - C.r}" width="${C.r * 2}" height="${C.r * 2}" clip-path="url(#cf)" preserveAspectRatio="xMidYMid slice"/>
  <circle cx="${C.cx}" cy="${C.cy}" r="${C.r - 2.5}" fill="none" stroke="${accent}" stroke-width="5"/>`
    : `<circle cx="${C.cx}" cy="${C.cy}" r="${C.r - 1.5}" fill="${bg}" stroke="${accent}" stroke-width="3"/>
  <circle cx="${C.cx}" cy="${C.cy}" r="90" fill="none" stroke="${accent}" stroke-width="1"/>
  <text x="${C.cx}" y="${C.cy + 29}" text-anchor="middle" font-family="${F_PF_ITALICO}" font-style="italic" font-weight="700" font-size="84" fill="#ffffff" letter-spacing="-1.7">${esc(iniciais(autor.nome))}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <rect x="160" y="120" width="856" height="2" fill="${accent}"/>
  <rect x="64" y="200" width="2" height="932" fill="${accent}"/>
  <rect x="1014" y="120" width="2" height="940" fill="${accent}"/>
  <rect x="64" y="1130" width="856" height="2" fill="${accent}"/>
  <text x="0" y="268" font-family="${F_ASPAS}" font-style="italic" font-weight="900" font-size="260" fill="${accent}">&#8220;</text>
  <text x="908" y="1287" font-family="${F_ASPAS}" font-style="italic" font-weight="900" font-size="260" fill="${accent}">&#8221;</text>
  <rect x="${540 - tagW / 2 - 14}" y="82" width="${tagW + 28}" height="82" fill="${bg}"/>
  <rect x="${540 - tagW / 2}" y="96" width="${tagW}" height="54" fill="${accent}"/>
  <text x="540" y="133" text-anchor="middle" font-family="${F_INTER}" font-weight="700" font-size="28" fill="#ffffff">@smufdpj</text>
  <text text-anchor="middle" font-family="${F_PF_ITALICO}" font-style="italic" font-weight="400" font-size="${fit.fs}" fill="#ffffff">${linhas}</text>
  <rect x="516" y="850" width="48" height="2" fill="${accent}"/>
  <text x="540" y="912" text-anchor="middle" font-family="${F_INTER}" font-weight="700" font-size="${fsNome}" letter-spacing="${(fsNome * 0.24).toFixed(1)}" fill="#ffffff">${esc(nome)}</text>
  ${linhaContexto ? `<text x="540" y="965" text-anchor="middle" font-family="${F_PF_ITALICO}" font-style="italic" font-size="${fsCtx}" fill="${claro}">${esc(linhaContexto)}</text>` : ""}
  <circle cx="${C.cx}" cy="${C.cy}" r="${C.r + 16}" fill="${bg}"/>
  ${circulo}
  <text x="540" y="1307" text-anchor="middle" font-family="${F_INTER}" font-size="24" letter-spacing="1" fill="${apagado}">somaisumfadepearljam.com.br</text>
  <rect x="991" y="364" width="48" height="${Math.round(arrasteH + 16)}" fill="${bg}"/>
  <text transform="translate(1008 373) rotate(90)" font-family="${F_INTER}" font-weight="700" font-size="22" letter-spacing="6.6" fill="${claro}">ARRASTE</text>
  <rect x="973" y="550" width="84" height="84" fill="${bg}"/>
  <rect x="984" y="561" width="62" height="62" fill="${bg}" stroke="${accent}" stroke-width="2"/>
  <text x="1015" y="604" text-anchor="middle" font-family="${F_INTER}" font-size="34" fill="#ffffff">&#8594;</text>
</svg>`;
}
