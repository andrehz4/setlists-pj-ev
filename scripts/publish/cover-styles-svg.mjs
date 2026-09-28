// SVG das capas alternativas (poster, zine, ingresso) a partir do plano de
// cover-styles.mjs. A foto entra ja recortada no tamanho do plano, como data
// URI (o zine gira a foto junto com o papel, entao nao da pra compor por fora).
import { F_ANTON, F_INTER_SB, F_INTER_XB, F_PLAYFAIR } from "./fontconfig-boot.mjs";
import { tarjaColor } from "./cover-styles.mjs";

const esc = (s) => String(s || "").replace(/[<>&"']/g, (c) =>
  ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]));

const assinatura = (y) => `<text x="540" y="${y}" text-anchor="middle" font-family="${F_PLAYFAIR}" font-style="italic"
    font-weight="900" font-size="28" fill="#ffffff" letter-spacing="-0.56">Só Mais um Fã de PEARL JAM</text>`;

const rodape = `<text x="56" y="1286" font-family="${F_INTER_SB}" font-size="19" fill="#ffffff" opacity="0.7"
    letter-spacing="0.5">somaisumfadepearljam.com.br</text>`;

const blur = (id, sd) => `<filter id="${id}" x="-40%" y="-40%" width="180%" height="180%">`
  + `<feGaussianBlur stdDeviation="${sd}"/></filter>`;

function tarjaSvg(p, bg) {
  return `<rect x="56" y="${p.tarja.y}" width="${p.tarja.w}" height="44" fill="${tarjaColor(bg)}"/>
  <text x="78" y="${p.tarja.y + 30}" font-family="${F_INTER_XB}" font-weight="800" font-size="22" fill="#ffffff"
    letter-spacing="2.2">${esc(p.label)}</text>`;
}

function manchete(p, fill = "#ffffff") {
  return p.lines.map((ln) => `<text x="56" y="${ln.y}" font-family="${F_ANTON}" font-size="${p.fs}" fill="${fill}"
    letter-spacing="0.35">${esc(ln.t)}</text>`).join("\n  ");
}

const foto = (p, uri) => uri
  ? `<image x="${p.photo.x}" y="${p.photo.y}" width="${p.photo.w}" height="${p.photo.h}"
    href="${uri}" xlink:href="${uri}"/>`
  : `<rect x="${p.photo.x}" y="${p.photo.y}" width="${p.photo.w}" height="${p.photo.h}" fill="#222222"/>`;

function poster(p, bg, uri) {
  return `<defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#000000" stop-opacity="0.65"/><stop offset="1" stop-color="#000000" stop-opacity="0"/>
  </linearGradient></defs>
  <rect width="1080" height="1350" fill="${bg}"/>
  ${foto(p, uri)}
  <rect width="1080" height="240" fill="url(#pg)"/>
  ${assinatura(64)}
  ${tarjaSvg(p, bg)}
  ${manchete(p)}`;
}

function zine(p, bg, uri) {
  const tiras = p.lines.map((ln) => `<g transform="rotate(${ln.rot} 56 ${ln.y})">
    <rect x="42" y="${ln.ry}" width="${ln.rw}" height="${ln.rh}" fill="#ffffff"/>
    <text x="56" y="${ln.y}" font-family="${F_ANTON}" font-size="${p.fs}" fill="#0a0a0a" letter-spacing="0.35">${esc(ln.t)}</text>
  </g>`).join("\n  ");
  return `<defs>${blur("zs", 22)}
    <pattern id="zd" width="16" height="16" patternUnits="userSpaceOnUse">
      <circle cx="8" cy="8" r="2.4" fill="#ffffff" fill-opacity="0.09"/></pattern></defs>
  <rect width="1080" height="1350" fill="${bg}"/>
  <rect width="1080" height="1350" fill="url(#zd)"/>
  ${assinatura(100)}
  <g transform="rotate(-2.5 540 480)">
    <rect x="100" y="210" width="880" height="600" fill="#000000" fill-opacity="0.5" filter="url(#zs)"/>
    <rect x="100" y="180" width="880" height="600" fill="#f4efe4"/>
    ${foto(p, uri)}
    <rect x="60" y="168" width="170" height="46" fill="#efe6c8" fill-opacity="0.8" transform="rotate(-32 145 191)"/>
    <rect x="850" y="168" width="170" height="46" fill="#efe6c8" fill-opacity="0.8" transform="rotate(32 935 191)"/>
  </g>
  <g transform="rotate(-2 56 ${p.tarja.y + 44})">${tarjaSvg(p, bg)}</g>
  ${tiras}`;
}

function ingresso(p, bg, uri) {
  return `<defs>${blur("is", 30)}</defs>
  <rect width="1080" height="1350" fill="${bg}"/>
  ${assinatura(84)}
  <rect x="56" y="154" width="968" height="740" fill="#000000" fill-opacity="0.45" filter="url(#is)"/>
  <rect x="56" y="130" width="968" height="740" fill="#efe7d6"/>
  ${foto(p, uri)}
  <line x1="772" y1="166" x2="772" y2="834" stroke="#0a0a0a" stroke-opacity="0.45" stroke-width="3" stroke-dasharray="4 12"/>
  <circle cx="772" cy="130" r="24" fill="${bg}"/>
  <circle cx="772" cy="870" r="24" fill="${bg}"/>
  <text transform="translate(944 500) rotate(-90)" text-anchor="middle" font-family="${F_ANTON}" font-size="150"
    fill="${bg}" letter-spacing="2">PEARL JAM</text>
  <text transform="translate(826 500) rotate(-90)" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800"
    font-size="20" fill="#0a0a0a" letter-spacing="5">ADMITE 1 FÃ</text>
  ${tarjaSvg(p, bg)}
  ${manchete(p)}`;
}

const DESENHO = { poster, zine, ingresso };

export function coverSvg(plan, bg, photoUri = null) {
  const corpo = DESENHO[plan.style](plan, bg, photoUri);
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1080" height="1350"
  viewBox="0 0 1080 1350">
  ${corpo}
  ${rodape}
</svg>`;
}
