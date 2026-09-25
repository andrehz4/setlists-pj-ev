// Monta o post do colaborador: id no site, crédito, legenda do Instagram e item do site.
// Funções puras (sem rede nem disco), testadas em curadoria.test.mjs.

const IG_MAX = 2200;
const HASHTAGS = "#pearljam #eddievedder #pjbrasil #grunge #smufdpj";
const SITE = "setlists-pj-ev.pages.dev";

export const idSite = (envio) => `colab-${envio.id.replace(/-/g, "").slice(0, 8)}`;

// "Marina Tavares Souza" -> "Marina S." (nome + inicial do último sobrenome; Gmail nunca aparece).
export function credito(nome) {
  const partes = String(nome || "").trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "um colaborador";
  if (partes.length === 1) return partes[0];
  return `${partes[0]} ${partes.at(-1)[0].toUpperCase()}.`;
}

function truncar(txt, max) {
  if (txt.length <= max) return txt;
  const corte = txt.slice(0, max);
  const p = Math.max(corte.lastIndexOf(". "), corte.lastIndexOf("? "), corte.lastIndexOf("! "));
  return (p > max * 0.5 ? corte.slice(0, p + 1) : corte.trim()) + "…";
}

export function legendaIG(envio) {
  const rodape = `\n\n📸 Enviado por ${credito(envio.autor?.nome)}, colaborador do SMUFDPJ.\nPost completo em ${SITE}\n\n${HASHTAGS}`;
  const cabeca = envio.title.trim();
  const espaco = IG_MAX - cabeca.length - rodape.length - 2;
  return `${cabeca}\n\n${truncar(envio.body.trim(), espaco)}${rodape}`;
}

// Primeiro parágrafo (até ~220 caracteres) vira a chamada do card no site.
export function intro(body) {
  const primeiro = body.trim().split(/\n\s*\n/)[0].replace(/\s+/g, " ");
  return primeiro.length <= 220 ? primeiro : truncar(primeiro, 220);
}

export function itemSite(envio, nowIso) {
  const id = idSite(envio);
  const video = !!envio.video && /\.(mp4|mov)$/i.test(envio.media?.[0]?.key || "");
  const corpoTexto = envio.body.trim() + (video ? "\n\nO vídeo com a fala completa está no Instagram @smufdpj." : "");
  return {
    item: {
      id, url: "", source: "colaborador", sourceLabel: `Colaborador · ${credito(envio.autor?.nome)}`,
      group: "colaborador", pubDate: nowIso, fetchedAt: nowIso, img: `/media/news/img/${id}.jpg`,
      title_pt: envio.title.trim(), intro_pt: intro(envio.body), tags: ["comunidade"], title_ig: envio.title.trim(),
    },
    corpo: { id, body_pt: corpoTexto },
  };
}
