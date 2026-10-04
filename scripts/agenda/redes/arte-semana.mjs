// Arte do post "Agenda da semana" (1080x1350, feed): lista dos shows por dia, com banda, casa e cidade.
import "../../publish/fontconfig-boot.mjs";
import { F_ANTON, F_INTER_SB, F_INTER_XB, F_PLAYFAIR } from "../../publish/fontconfig-boot.mjs";
import { escapeXml } from "../../publish/slide/base.mjs";
import { diaSemana, dm } from "./semana.mjs";

const W = 1080, H = 1350;
const { default: sharp } = await import("sharp");

export function svgSemana(lista, inicio, fim, cor = "#2a5b9e") {
  const max = 9;
  const mostrar = lista.slice(0, max);
  const passo = mostrar.length > 6 ? 92 : 112;
  const linhas = mostrar.map((s, i) => {
    const y = 470 + i * passo;
    const onde = [s.casa ? `@${s.casa}` : s.casaNome, [s.cidade, s.uf].filter(Boolean).join("/")].filter(Boolean).join(" · ");
    return `<text x="80" y="${y}" font-family="${F_INTER_XB}" font-weight="800" font-size="30" fill="#E10600">${escapeXml(`${diaSemana(s.data).toUpperCase()} ${dm(s.data)}`)}</text>
    <text x="280" y="${y}" font-family="${F_ANTON}" font-size="44" fill="#fff">${escapeXml(s.nome.toUpperCase())}</text>
    <text x="280" y="${y + 36}" font-family="${F_INTER_SB}" font-size="26" fill="#fff" opacity="0.8">${escapeXml(onde || "local a confirmar")}</text>`;
  }).join("\n");
  const resto = lista.length > max ? `<text x="80" y="${470 + max * passo}" font-family="${F_INTER_SB}" font-size="28" fill="#fff" opacity="0.8">+ ${lista.length - max} show(s) na agenda do site</text>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${cor}"/><rect width="${W}" height="${H}" fill="#000" opacity="0.3"/>
  <text x="${W / 2}" y="80" text-anchor="middle" font-family="${F_PLAYFAIR}" font-style="italic" font-weight="900" font-size="32" fill="#fff">Só Mais um Fã de PEARL JAM</text>
  <text x="80" y="250" font-family="${F_ANTON}" font-size="140" fill="#fff">AGENDA</text>
  <text x="80" y="340" font-family="${F_ANTON}" font-size="70" fill="#fff" opacity="0.9">DA SEMANA · ${escapeXml(dm(inicio))} A ${escapeXml(dm(fim))}</text>
  <rect x="80" y="372" width="${W - 160}" height="4" fill="#E10600"/>
  ${linhas}
  ${resto}
  <text x="${W / 2}" y="${H - 60}" text-anchor="middle" font-family="${F_INTER_SB}" font-size="28" fill="#fff" opacity="0.85">agenda completa: somaisumfadepearljam.com.br/agenda</text>
</svg>`;
}

export async function gerarArteSemana(lista, inicio, fim, destino, cor) {
  await sharp(Buffer.from(svgSemana(lista, inicio, fim, cor))).jpeg({ quality: 90, mozjpeg: true }).toFile(destino);
  return destino;
}
