// Layout X, cena 5 (12.5 a 15): um raio fino cai no letreiro pendurado e o neon acende linha a linha com o pedido
// de compartilhar; embaixo, uma segunda placa de neon (outra cor de tubo) com "Siga @smufdpj" e o link da agenda.
import { p, pop, enter, lerp, clamp } from "../../tempo.mjs";
import { fundo, neon, ligado, leque, molduraDeco, txt, cabe, f1, op3 } from "./pecas.mjs";
import { raio, clarao, lampada } from "./eletrica.mjs";

// placa pendurada por dois cabos que descem do topo da tela
function placa(x, y, w, h, cor, s = 30) {
  return `<path d="M${x + 110},-300 V${y} M${x + w - 110},-300 V${y}" stroke="${cor.fio}" stroke-width="3"/>
    <rect x="${x + 12}" y="${y + 16}" width="${w}" height="${h}" fill="#000" opacity="0.45"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${cor.bg}"/>
    ${molduraDeco(x, y, w, h, cor.ouro, { s })}`;
}

export function cenaFinal(T, cor) {
  if (T < 12.5) return "";
  const l = ["COMPARTILHA", "COM QUEM VAI", "COM VOCÊ"], f = Math.min(...l.map((t) => cabe(t, 720, 140, "anton", 2)));
  const x = 100, w = 880, y = 450, h = 120 + l.length * f * 1.12 + 40;
  const kq = p(T, 12.5, 0.5, pop), dy = lerp(-y - h, 0, clamp(kq, 0, 1.2));
  const um = `<g transform="translate(0 ${f1(dy)})">${placa(x, y, w, h, cor)}${leque(540, y, 120, 180, 360, 14, cor.ouro, { op: 0.9, w: 1.4 })}
    ${l.map((t, i) => neon(540, y + 110 + i * f * 1.12 + f * 0.8, t, f, cor, ligado(T, 12.85 + i * 0.16), { ls: 2 })).join("")}
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => lampada(x + 160 + i * 93.3, y + h - 34, 9, cor, ligado(T, 13.3 + i * 0.05))).join("")}</g>`;
  // segunda placa: tubo na cor 2 (o núcleo continua claro)
  const cor2 = { ...cor, neon: cor.neon2, nucleo: cor.nucleo2 }, y2 = y + h + 150, h2 = 220;
  const k2 = p(T, 13.2, 0.45, enter), fs = cabe("Siga @smufdpj", 720, 110, "anton");
  const dois = `<g opacity="${op3(k2)}" transform="translate(0 ${f1((1 - k2) * -60)})">
    <path d="M${x + 210},${y + h} V${y2} M${x + w - 210},${y + h} V${y2}" stroke="${cor.fio}" stroke-width="3"/>
    <rect x="${x + 72}" y="${y2 + 16}" width="${w - 120}" height="${h2}" fill="#000" opacity="0.45"/><rect x="${x + 60}" y="${y2}" width="${w - 120}" height="${h2}" fill="${cor.bg}"/>
    ${molduraDeco(x + 60, y2, w - 120, h2, cor.ouro, { s: 22 })}${neon(540, y2 + h2 / 2 + fs * 0.36, "Siga @smufdpj", fs, cor2, ligado(T, 13.45))}</g>`;
  const site = "somaisumfadepearljam.com.br/agenda", ks = p(T, 13.8, 0.45, enter);
  return fundo(cor) + clarao(T, 12.62, cor) + raio(T, 12.6, [960, -20], [560, y + 30], cor, { semente: 7, desvio: 110, w: 0.7 }) + um + dois +
    txt(540, y2 + h2 + 140, site, cabe(site, 820, 44, "xb"), cor.texto, { fonte: "xb", op: ks });
}
