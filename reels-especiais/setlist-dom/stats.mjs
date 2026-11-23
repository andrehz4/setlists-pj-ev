// Slides de estatística do domingo (22/11), no molde do balanço de sexta (eddie-balanco): o que foi raro e o palpite conferido.
// Números do histórico solo do setlist.fm (eddie-carreira/bruto, 315 shows até 25/09/2026, sem as duas noites de SP),
// conferidos em 22/11 22h45. Palpite: slides 06 a 08 do carrossel eddie-balanco.
export function slidesStats({ S, BS, tag, tit, rodape, n }) {
  const linhas = (itens, cor) => itens.map(([nome, obs, valor]) => `<div style="display:flex;align-items:center;justify-content:space-between;gap:24px;padding:18px 0;border-top:4px solid ${cor};">
  <div><div style="font-weight:900;font-size:40px;line-height:1.05;">${nome}</div><div style="margin-top:6px;font-weight:700;font-size:25px;opacity:.8;">${obs}</div></div>
  <div style="${BS}font-size:72px;line-height:.9;white-space:nowrap;">${valor}</div></div>`).join("");
  const raro = `<div data-screen-label="slide-${String(n).padStart(2, "0")}" style="${S}background:var(--fundo);color:var(--claro);">
  <div style="position:absolute;top:72px;left:72px;right:72px;">${tag("O QUE FOI RARO")}${tit("Quem foi viu", 140)}</div>
  <div style="position:absolute;top:330px;left:72px;right:72px;">${linhas([
    ["She Asked Me", "só tinha tocado uma vez, Londres 2024", "2ª VEZ"],
    ["Off He Goes", "fora dos shows solo desde 2019", "1ª EM 7 ANOS"],
    ["Black", "nas duas noites de São Paulo", "25 EM 317"],
    ["Long Road", "abriu o domingo", "34 EM 317"],
  ], "var(--destaque)")}</div>
  <div style="position:absolute;top:1130px;left:72px;right:72px;font-weight:800;font-size:24px;line-height:1.25;">Contando os 315 shows solo até setembro e as duas noites de São Paulo.</div>
  ${rodape(n)}</div>`;
  const palpite = `<div data-screen-label="slide-${String(n + 1).padStart(2, "0")}" style="${S}background:var(--destaque);color:var(--fundo);">
  <div style="position:absolute;top:72px;left:72px;right:72px;"><div style="display:inline-block;background:var(--fundo);color:var(--destaque);font-weight:900;font-size:24px;letter-spacing:.14em;padding:8px 14px;">PALPITE CONFERIDO</div><div style="margin-top:18px;${BS}font-size:130px;line-height:.88;text-transform:uppercase;letter-spacing:-2px;">O Eddie repetiu mais</div></div>
  <div style="position:absolute;top:400px;left:72px;right:72px;">${linhas([
    ["Repetiu da sexta", "a média das 2ªs noites era 42%", "13 DE 18"],
    ["Ficaram", "Hard Sun, Porch e Far Behind", "3 DE 5"],
    ["Descansaram", "Last Kiss e Brain Damage", "2 DE 4"],
    ["Entraram", "nenhuma das cinco que a gente cravou", "0 DE 5"],
  ], "var(--fundo)")}</div>
  <div style="position:absolute;top:1130px;left:72px;right:72px;font-weight:800;font-size:24px;line-height:1.25;">Domingo foi 72% sexta. A gente apostou num show bem diferente e errou.</div>
  ${rodape(n + 1).replaceAll("var(--claro)", "var(--fundo)").replaceAll("color:var(--destaque)", "color:var(--fundo)")}</div>`;
  return [raro, palpite];
}
