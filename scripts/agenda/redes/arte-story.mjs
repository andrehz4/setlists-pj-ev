// Arte do story de aviso do dia (1080x1920): "ALÔ, PESSOAL DO RJ! HOJE TEM PEARL JAM AO VIVO" + os shows do
// estado (banda, @casa, cidade, horário). Mesmas fontes do carrossel; o @ vai escrito na arte porque a
// marcação no story depende da API aceitar.
import "../../publish/fontconfig-boot.mjs";
import { F_ANTON, F_INTER_SB, F_INTER_XB, F_PLAYFAIR } from "../../publish/fontconfig-boot.mjs";
import { escapeXml } from "../../publish/slide/base.mjs";
import { saudacao, horaCurta } from "./regiao.mjs";

const W = 1080, H = 1920;
const { default: sharp } = await import("sharp");

function blocoShow(s, y) {
  const linha2 = [s.casa ? `@${s.casa}` : s.casaNome, s.cidade, horaCurta(s.hora)].filter(Boolean).join("  ·  ");
  return `<text x="90" y="${y}" font-family="${F_ANTON}" font-size="92" fill="#ffffff">${escapeXml(s.nome.toUpperCase())}</text>
  <text x="90" y="${y + 62}" font-family="${F_INTER_SB}" font-size="38" fill="#ffffff" opacity="0.88">${escapeXml(linha2 || "local a confirmar")}</text>
  <text x="90" y="${y + 108}" font-family="${F_INTER_SB}" font-size="28" fill="#ffffff" opacity="0.6">@${escapeXml(s.banda)}</text>`;
}

export function svgStory(uf, shows, cor = "#2a5b9e") {
  const lista = shows.slice(0, 4);
  const inicio = 900, passo = lista.length > 2 ? 210 : 250;
  const extra = shows.length > lista.length ? `<text x="90" y="${inicio + lista.length * passo}" font-family="${F_INTER_SB}" font-size="34" fill="#fff" opacity="0.8">+ ${shows.length - lista.length} show(s) na agenda do site</text>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${cor}"/>
  <rect width="${W}" height="${H}" fill="#000" opacity="0.28"/>
  <text x="${W / 2}" y="130" text-anchor="middle" font-family="${F_PLAYFAIR}" font-style="italic" font-weight="900" font-size="42" fill="#fff">Só Mais um Fã de PEARL JAM</text>
  <text x="90" y="420" font-family="${F_ANTON}" font-size="120" fill="#fff">${escapeXml(saudacao(uf))}</text>
  <rect x="90" y="480" width="${W - 180}" height="96" fill="#E10600"/>
  <text x="${W / 2}" y="545" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="46" fill="#fff" letter-spacing="3">HOJE TEM PEARL JAM AO VIVO</text>
  <text x="90" y="700" font-family="${F_INTER_SB}" font-size="34" fill="#fff" opacity="0.75">tributo e cover, direto da agenda das bandas</text>
  ${lista.map((s, i) => blocoShow(s, inicio + i * passo)).join("\n")}
  ${extra}
  <text x="${W / 2}" y="${H - 150}" text-anchor="middle" font-family="${F_INTER_XB}" font-weight="800" font-size="34" fill="#fff" letter-spacing="2">AGENDA COMPLETA NO SITE</text>
  <text x="${W / 2}" y="${H - 100}" text-anchor="middle" font-family="${F_INTER_SB}" font-size="30" fill="#fff" opacity="0.8">somaisumfadepearljam.com.br/agenda</text>
</svg>`;
}

export async function gerarArteStory(uf, shows, destino, cor) {
  await sharp(Buffer.from(svgStory(uf, shows, cor))).jpeg({ quality: 90, mozjpeg: true }).toFile(destino);
  return destino;
}
