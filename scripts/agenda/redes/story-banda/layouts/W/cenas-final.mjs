// Layout W, cena 5 (12.5 a 15): balão grande com a chamada pra compartilhar, a folha na máquina de escrever bate
// "Siga a gente", a tecla de apagar afunda e come o texto, e a máquina reescreve "Siga @smufdpj". Link do site num
// recordatório e um coqueiro com sol fechando a tirinha.
import { p, pop, enter } from "../../tempo.mjs";
import { balao, legenda, fundo, txt, datilo, batido, f1, op3 } from "./pecas.mjs";
import { cabe } from "./medida.mjs";
import { tecla, coqueiro, sol } from "./desenhos.mjs";

const RASCUNHO = "Siga a gente", CERTO = "Siga @smufdpj", SITE = "somaisumfadepearljam.com.br/agenda";
const LINHAS = ["COMPARTILHA", "COM QUEM VAI", "COM VOCÊ!"];

// roteiro da máquina: bate o rascunho, apaga com a tecla, bate o certo (tudo antes de T = 15, o final segura parado)
function maquina(T) {
  const k1 = p(T, 12.8, 0.45, (x) => x), ap = p(T, 13.4, 0.45, (x) => x), k2 = p(T, 13.95, 0.6, (x) => x);
  const texto = T < 13.95 ? batido(RASCUNHO, k1, ap) : batido(CERTO, k2);
  const aperta = ap > 0 && ap < 1 ? 0.5 + 0.5 * Math.sin(ap * Math.PI * 6) : 0;
  return { texto, aperta, errado: T < 13.95 };
}

export function cenaFinal(T, cor) {
  if (T < 12.5) return "";
  const kb = p(T, 12.5, 0.4, pop), f = Math.min(...LINHAS.map((l) => cabe(l, 700, 96, "archivo", 1)));
  const chamada = balao(540, 540, 940, 540, cor, { tx: 250, ty: 880, k: kb }) +
    (kb > 0.6 ? LINHAS.map((l, i) => txt(540, 540 + (i - 1) * f * 1.15 + f * 0.36, l, f, cor.linha, { ls: 1 })).join("") : "");
  const kf = p(T, 12.65, 0.35, enter), m = maquina(T), fs = cabe(CERTO, 600, 72, "semi", 2);
  // folha presa no rolo: faixa cinza do rolo, papel com pautas leves e o texto datilografado
  const folha = kf > 0 ? `<g opacity="${op3(kf)}" transform="translate(0 ${f1((1 - kf) * 40)})">
    <rect x="96" y="1092" width="888" height="40" rx="20" fill="#3a3a3a" stroke="${cor.linha}" stroke-width="4"/>
    ${legenda(140, 900, 800, 210, cor, cor.balao, `<path d="M170,1040 H910 M170,1074 H910" stroke="${cor.piscina}" stroke-width="2" opacity="0.5"/>` +
      datilo(180, 1030, m.texto, fs, m.errado ? cor.vermelho : cor.linha, { T, cursor: true }), 0)}</g>` : "";
  const kt = p(T, 13.2, 0.3, pop);
  const tec = kt > 0 ? `<g transform="translate(860 1250) scale(${kt.toFixed(3)}) translate(-860 -1250)">${tecla(860, 1250, 1.45, cor, m.aperta)}</g>` : "";
  const ks = p(T, 14.5, 0.35, enter), fsite = cabe(SITE, 760, 42, "sans");
  const site = ks > 0 ? `<g opacity="${op3(ks)}">${legenda(110, 1500, 860, 96, cor, cor.amarelo, txt(540, 1548 + fsite * 0.36, SITE, fsite, cor.linha, { fonte: "sans" }), -1)}</g>` : "";
  const cena = p(T, 12.9, 0.5, enter);
  const praia = `<g opacity="${op3(cena)}">${sol(520, 1260, 0.8, cor, T * 30)}${coqueiro(260, 1300, 1.35, cor)}</g>`;
  return fundo(cor) + chamada + praia + folha + tec + site;
}
