// Legenda do reel da agenda, no formato da 1ª (W48, aprovada e agendada à mão em reels-especiais/agenda-semana/publicar.json):
// pergunta + resumo, um bloco por dia com "Cidade/UF: banda no casa, hora", link da bio, chamada e hashtags.
// Marcar banda e casa dá repost das bandas (alcance de não seguidor); o IG recusa mais de 20 menções.
import { MAX_MENCOES } from "../../agenda/redes/semana.mjs";
import { horaCurta } from "../../agenda/redes/regiao.mjs";
import { nomeDia } from "./tempos.mjs";
import { FECHO } from "./falas.mjs";

const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const dm = (d) => `${d.slice(8)}/${d.slice(5, 7)}`;

export function legendaDoReel(shows) {
  let mencoes = 0;
  const arroba = (h) => (mencoes < MAX_MENCOES ? (mencoes++, `@${h}`) : h);
  const dias = [...new Set(shows.map((s) => s.data))];
  const nCidades = new Set(shows.map((s) => `${s.cidade}|${s.uf}`)).size;
  const blocos = dias.map((d) => [
    `${nomeDia(d)} ${dm(d)}`,
    ...shows.filter((s) => s.data === d).map((s) => {
      // banda com o nome igual ao @ aparece só pelo @ (Blaymorphed = @blaymorphed)
      const banda = norm(s.nome) === norm(s.banda) ? arroba(s.banda) : `${s.nome} (${arroba(s.banda)})`;
      const casa = s.casa ? ` no ${arroba(s.casa)}` : s.casaNome ? ` no ${s.casaNome}` : "";
      const hora = s.hora ? `, ${horaCurta(s.hora)}` : "";
      return `${s.cidade}/${s.uf}: ${banda}${casa}${hora}`;
    }),
  ].join("\n"));
  const resumo = shows.length === 1 ? "Um show de banda cover essa semana."
    : `São ${shows.length} shows de bandas cover em ${nCidades} ${nCidades === 1 ? "cidade" : "cidades"}.`;
  return [
    `Onde tem Pearl Jam ao vivo essa semana? ${resumo}`,
    ...blocos,
    "Agenda completa no link da bio. Marca quem vai com você!",
    FECHO,
    "#PearlJam #BandaCover #PearlJamCover #RockAoVivo #AgendaDaSemana",
  ].join("\n\n");
}
