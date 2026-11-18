// Classifica comentário do IG como oferta ou procura de ingresso (pra responder apontando pro post de ingressos).
// Só texto: quem decide responder é o Andre, olhando a lista do modo "listar".
const VENDA = /\b(vendo|repasso|vende-se|a venda|à venda|pre[çc]o de custo|tenho (\d+|um|uma|dois|duas) ingress|estou com (\d+|um|uma|dois|duas) ingress|ingressos? (pra|para) (vender|venda))/i;
const PROCURA = /\b(procuro|procurando ingress|compro ingress|algu[eé]m (vendendo|vende|com ingress)|quem tiver ingress|preciso de (um |uma |\d+ )?ingress)/i;

export function tipoIngresso(texto = "") {
  if (VENDA.test(texto)) return "venda";
  if (PROCURA.test(texto)) return "procura";
  return null;
}
