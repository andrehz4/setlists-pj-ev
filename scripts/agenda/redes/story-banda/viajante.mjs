// Quem viaja na ponta da estrada da rota de turnê (mapa C). Padrão: o logo da banda num círculo, quicando de leve (sem
// logo, a palheta girada na direção da estrada). O stickman andando fica de opção (AGENDA_VIAJANTE=boneco).
import { COR } from "./pecas.mjs";

export const VIAJANTES = ["palheta", "boneco", "logo"];

// boneco de traço: cabeça, tronco, braços pra cima no fim (chegou), pernas num ciclo de passada
function boneco(T, dir, chegou) {
  const passo = Math.sin(T * Math.PI * 2 * 2.6) * (1 - chegou), perna = 26 * passo, braco = -20 * passo;
  const bracos = chegou > 0.5 ? "M0,-30 L-20,-58 M0,-30 L20,-58" : `M0,-30 L${-16 + braco * 0.3},${-10 + braco * 0.4} M0,-30 L${16 - braco * 0.3},${-10 - braco * 0.4}`;
  const d = `M0,-34 L0,0 ${bracos} M0,0 L${-12 + perna * 0.5},26 M0,0 L${12 - perna * 0.5},26`;
  const pulo = -Math.abs(passo) * 5;
  return `<g transform="translate(0 ${(pulo - 26).toFixed(1)}) scale(${dir} 1)">
  <path d="${d}" fill="none" stroke="${COR.creme}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="0" cy="-48" r="13" fill="${COR.creme}"/>
  <path d="${d}" fill="none" stroke="${COR.tinta}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="0" cy="-48" r="9" fill="${COR.tinta}"/></g>`;
}

function logo(T, uri, cor) {
  const quica = -Math.abs(Math.sin(T * Math.PI * 2 * 2.2)) * 10;
  const miolo = uri ? `<clipPath id="viaj-logo"><circle r="34"/></clipPath><image href="${uri}" x="-34" y="-34" width="68" height="68" clip-path="url(#viaj-logo)"/>`
    : `<circle r="34" fill="${cor.pin}"/>`;
  return `<g transform="translate(0 ${(quica - 40).toFixed(1)})"><circle cx="3" cy="5" r="40" fill="${COR.tinta}" opacity="0.35"/>
  <circle r="40" fill="${COR.creme}"/>${miolo}<circle r="34" fill="none" stroke="${COR.tinta}" stroke-width="3"/></g>`;
}

// e = ponta da estrada, ang = direção (graus), fim = 0 andando -> 1 chegou
export function viajante(T, tipo, { e, ang, chegou, cor, logoUri }) {
  const pos = `translate(${e[0].toFixed(1)} ${e[1].toFixed(1)})`;
  if (tipo === "boneco") return `<g transform="${pos} scale(1.5)">${boneco(T, Math.cos((ang * Math.PI) / 180) < 0 ? -1 : 1, chegou)}</g>`;
  if (tipo === "logo") return `<g transform="${pos} scale(1.35)">${logo(T, logoUri, cor)}</g>`;
  return `<g transform="${pos} rotate(${ang.toFixed(1)})"><path d="M22 0C14 14-8 20-16 12C-22 6-22-6-16-12C-8-20 14-14 22 0Z" fill="${cor.pin}" stroke="${COR.creme}" stroke-width="4"/></g>`;
}
