// Layout T, cena 5 (12.5 a 15): tela de osciloscópio com os dois canais, L e R, cada um na sua linha e no seu desenho;
// eles descem um para o outro e viram uma onda só (L+R), que traz a chamada, o @smufdpj e o link da agenda.
import { p, move, enter } from "../../tempo.mjs";
import { ceu, txt, cabecalho, f1 } from "./ceu.mjs";
import { ondaCanal, telaOsc, colchetes } from "./desenhos.mjs";
import { cabe } from "./medida.mjs";

export function cenaFinal(T, cor) {
  if (T < 12.5) return "";
  const X = 90, Y = 360, W = 900, H = 500, yL = Y + 150, yR = Y + 350, junta = p(T, 12.75, 1.3, move), ko = p(T, 12.5, 0.4, enter);
  const base = { x0: X + 40, x1: X + W - 40, yL, yR, amp: 66, junta, T, cor };
  const soma = junta > 0.6 ? ondaCanal("L", { ...base, junta: 1, w: 3.4, cor: { ...cor, canalL: cor.estrela } }) : "";
  const rotulo = (t, y, op) => `<g opacity="${op.toFixed(3)}"><rect x="${X + 22}" y="${f1(y - 40)}" width="${t.length > 1 ? 92 : 50}" height="36" rx="8" fill="none" stroke="${cor.linha}" stroke-width="1.4"/>
    ${txt(X + 22 + (t.length > 1 ? 46 : 25), y - 14, t, 22, cor.texto, { fonte: "sb", ls: 1 })}</g>`;
  const meio = (yL + yR) / 2, osc = `<g opacity="${ko.toFixed(3)}">${telaOsc(X, Y, W, H, cor)}
    ${ondaCanal("L", base)}${ondaCanal("R", base)}<g opacity="${p(T, 13.55, 0.4, enter).toFixed(3)}">${soma}</g>
    ${rotulo("L", yL - 62 + (meio - yL) * junta, 1 - junta)}${rotulo("R", yR - 62 + (meio - yR) * junta, 1 - junta)}${rotulo("L+R", meio - 70, p(T, 13.6, 0.4, enter))}
    ${txt(X + W - 24, Y + H - 22, junta > 0.9 ? "UM SÓ CANAL" : "2 CANAIS", 20, cor.texto2, { anchor: "end", fonte: "sb", ls: 4 })}</g>`;
  const l = ["COMPARTILHA", "COM QUEM VAI", "COM VOCÊ"], f = Math.min(...l.map((t) => cabe(t, 860, 128, "anton", 3))), kt = p(T, 13.3, 0.6, enter);
  const chamada = l.map((t, i) => { const k = p(T, 13.3 + i * 0.14, 0.5, enter);
    return txt(540, 960 + (i + 0.86) * f * 1.1, t, f, cor.texto, { fonte: "anton", ls: 3, op: k.toFixed(3) }); }).join("");
  const yF = 960 + l.length * f * 1.1, site = "somaisumfadepearljam.com.br/agenda", kf = p(T, 13.9, 0.5, enter);
  const fim = `<g opacity="${kf.toFixed(3)}" transform="translate(0 ${f1((1 - kf) * 20)})">${colchetes(190, yF + 34, 700, 120, cor.acento, 28, 2)}
    ${txt(540, yF + 116, "Siga @smufdpj", cabe("Siga @smufdpj", 620, 62, "xb"), cor.texto)}
    ${txt(540, yF + 220, site, cabe(site, 860, 38, "sb"), cor.texto2, { fonte: "sb" })}</g>`;
  return ceu(T, cor) + cabecalho(250, "SINAL ESTÉREO", cor, ko) + osc + `<g opacity="${kt.toFixed(3)}">${chamada}</g>` + fim;
}
