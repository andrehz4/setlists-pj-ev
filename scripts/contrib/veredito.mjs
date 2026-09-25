// Transforma a análise da IA no veredito final. Funções puras (sem rede), testadas.
// Camada de segurança por cima da IA: regra violada OU incerta = recusa; sem travessão;
// "ajustado" só quando algo realmente mudou; campo faltando cai no original da pessoa.

export const REGRAS = ["musica", "tema", "respeito"];

const MOTIVOS = {
  musica: "Tem música tocando no áudio do vídeo (regra de ouro 1). Grave de novo só com a sua voz e reenvie.",
  musica_incerto: "Não deu pra ter certeza de que não há música no fundo do vídeo (regra de ouro 1). Grave num lugar sem som ambiente e reenvie.",
  tema: "O post precisa ser sobre Pearl Jam ou Eddie Vedder, com foto ou vídeo seu (regra de ouro 2).",
  respeito: "O post tem algo que vai contra a regra de ouro 3 (respeito e verdade).",
  geral: "A curadoria não conseguiu aprovar este post. Revise e envie de novo.",
  ajuste: "Fizemos pequenas correções no texto.",
};

export function semTravessao(texto) {
  return String(texto ?? "")
    .replace(/\s*[—–]\s*(?=[.,;:!?)]|$)/gm, "")
    .replace(/\s+[—–]\s+/g, ", ")
    .replace(/[—–]/g, ", ")
    .replace(/ {2,}/g, " ")
    .trim();
}

function limpo(valor, original, min, max) {
  const v = semTravessao(valor).slice(0, max).trim();
  return v.length >= min ? v : semTravessao(original).slice(0, max);
}

function legendasFinais(envio, ia) {
  const orig = envio.video?.legendas;
  if (!orig) return null;
  const novas = Array.isArray(ia.legendas) && ia.legendas.length === orig.length ? ia.legendas : orig.map((l) => l.text);
  return orig.map((l, i) => ({ start: l.start, end: l.end, text: semTravessao(novas[i] || l.text).slice(0, 300) }));
}

export function decidir(envio, ia) {
  const analise = { regras: ia.regras || {}, fatos: ia.fatos || [], resumo: ia.resumo || "", decisao_ia: ia.decisao };
  const base = { titulo: semTravessao(envio.title), texto: semTravessao(envio.body), legendas: legendasFinais(envio, {}), analise };

  for (const regra of REGRAS) {
    const status = ia.regras?.[regra]?.status;
    if (status !== "ok") {
      const chave = regra === "musica" && status === "incerto" ? "musica_incerto" : regra;
      const motivo = ia.decisao === "recusado" && ia.motivo ? semTravessao(ia.motivo) : MOTIVOS[chave];
      return { ...base, decisao: "recusado", motivo };
    }
  }
  if (ia.decisao === "recusado") {
    return { ...base, decisao: "recusado", motivo: semTravessao(ia.motivo) || MOTIVOS.geral };
  }

  const titulo = limpo(ia.titulo, envio.title, 3, 120);
  const texto = limpo(ia.texto, envio.body, 20, 5000);
  const legendas = legendasFinais(envio, ia);
  const mudouLegenda = legendas && legendas.some((l, i) => l.text !== envio.video.legendas[i].text);
  const mudou = titulo !== envio.title || texto !== envio.body || mudouLegenda;
  return {
    titulo, texto, legendas, analise,
    decisao: mudou ? "ajustado" : "aprovado",
    motivo: mudou ? semTravessao(ia.motivo) || MOTIVOS.ajuste : null,
  };
}

// Linha curta pro Telegram do Andre.
export function resumoTelegram(envio, v, horario) {
  const icone = { aprovado: "✅", ajustado: "✏️", recusado: "⛔" }[v.decisao];
  const quem = envio.autor?.instagram ? `@${envio.autor.instagram}` : envio.autor?.nome || envio.autor?.email || "colaborador";
  const linhas = [`${icone} Colaborador ${v.decisao}: "${v.titulo}"`, `por ${quem} · vai ao ar às ${horario}`];
  if (v.decisao === "recusado") linhas[1] = `por ${quem} · não vai ao ar`;
  if (v.motivo) linhas.push(v.motivo);
  if (v.analise.resumo) linhas.push(`IA: ${v.analise.resumo}`);
  return linhas.join("\n");
}
