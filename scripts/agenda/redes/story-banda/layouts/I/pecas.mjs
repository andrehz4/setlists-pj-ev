// Layout I ("Edição Extra", jornal): peças comuns. Retícula, hachura, linhas de texto falso, faixa de seção e
// revelação por cortina (wipe). Tudo função pura de T.
import { esc, F_ANTON, F_INTER_XB, F_PLAYFAIR } from "../../pecas.mjs";

export const F_SERIF = "'Instrument Serif',Georgia,serif";
export { esc, F_ANTON, F_INTER_XB, F_PLAYFAIR };
export const MESES = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
export const DIAS = ["DOMINGO", "SEGUNDA-FEIRA", "TERÇA-FEIRA", "QUARTA-FEIRA", "QUINTA-FEIRA", "SEXTA-FEIRA", "SÁBADO"];
export const dataJornal = (dia) => { const d = new Date(`${dia}T12:00:00Z`); return `${DIAS[d.getUTCDay()]}, ${d.getUTCDate()} DE ${MESES[d.getUTCMonth()]} DE ${d.getUTCFullYear()}`; };
// Anton é estreito: ~0.46 do corpo por letra em caixa alta
export const cabeAnton = (t, largura, max) => Math.min(max, largura / (String(t).length * 0.46));

// padrões: retícula (pontos) e hachura (linhas a 45°)
export const padroes = (cor) => `<defs><pattern id="ret" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="4.5" cy="4.5" r="1.9" fill="${cor.tinta}"/></pattern>
  <pattern id="hac" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="4" height="12" fill="${cor.tinta}"/></pattern></defs>`;

// colunas de texto falso (barras cinza), determinísticas
export function colunas({ x, y, w, h, n = 2, gap = 30, cor, semente = 1 }) {
  const cw = (w - (n - 1) * gap) / n, out = [];
  for (let c = 0; c < n; c++) for (let yy = y, k = 0; yy < y + h; yy += 26, k++) {
    const curta = (k * 7 + c * 3 + semente) % 9 === 0;
    out.push(`<rect x="${x + c * (cw + gap)}" y="${yy}" width="${(curta ? cw * 0.55 : cw).toFixed(1)}" height="9" fill="${cor.tinta}" opacity="0.22"/>`);
  }
  return out.join("");
}

// faixa de seção: retângulo de cor com texto em caixa alta
export const secao = (texto, x, y, cor, op = 1) => `<g opacity="${op}"><rect x="${x}" y="${y}" width="${texto.length * 24 + 44}" height="52" fill="${cor.acento}"/>
  <text x="${x + 22}" y="${y + 37}" font-family="${F_INTER_XB}" font-weight="800" font-size="30" letter-spacing="3" fill="${cor.sobreAcento}">${esc(texto)}</text></g>`;

let _id = 0;
// cortina: revela o conteúdo da esquerda pra direita (k 0..1) dentro da faixa vertical [y, y+h]
export function cortina(k, y, h, miolo) {
  if (k <= 0) return "";
  const id = `ct${++_id}`;
  return `<clipPath id="${id}"><rect x="0" y="${y}" width="${(1080 * k).toFixed(1)}" height="${h}"/></clipPath><g clip-path="url(#${id})">${miolo}</g>`;
}

export const fio = (x, y, w, cor, grosso = 3) => `<rect x="${x}" y="${y}" width="${w}" height="${grosso}" fill="${cor.tinta}"/>`;
