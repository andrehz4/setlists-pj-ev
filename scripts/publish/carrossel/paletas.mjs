// Paletas do modelo de carrossel (media/carrossel/<modelo>/modelo.html usa estas variáveis CSS).
// destaque: cor forte (títulos, barras) · fundo: base escura · alerta: selo "FALTAM X DIAS" e destaques pontuais
// papel/papel2: fundos claros · claro: texto sobre fundo escuro.

export const PALETAS = {
  // original do Claude Design (carrossel do ranking do Eddie, 17/11/2026)
  amarelo: { destaque: "#FFCC1A", fundo: "#14110F", alerta: "#E0361C", papel: "#f3efe6", papel2: "#E9E1CF", claro: "#fff" },
  laranja: { destaque: "#FF7A1A", fundo: "#140C07", alerta: "#D7263D", papel: "#FFF1D6", papel2: "#F3DFC0", claro: "#fff" },
  vermelho: { destaque: "#E8202A", fundo: "#0F0B0B", alerta: "#FFCC1A", papel: "#F4EEE6", papel2: "#E6DCCD", claro: "#fff" },
  verde: { destaque: "#9BE15D", fundo: "#0B140E", alerta: "#FF5A36", papel: "#EEF4E6", papel2: "#DCE8CF", claro: "#fff" },
  azul: { destaque: "#4FC3F7", fundo: "#08111A", alerta: "#FF4F79", papel: "#EAF2F8", papel2: "#D5E4EF", claro: "#fff" },
  rosa: { destaque: "#FF3D7F", fundo: "#1C0830", alerta: "#FFB347", papel: "#FCEAF1", papel2: "#F2D6E2", claro: "#fff" },
};

const CHAVES = ["destaque", "fundo", "alerta", "papel", "papel2", "claro"];
const COR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

// Resolve "nome" ou objeto parcial ({destaque:"#..."}) por cima da amarela. Cor inválida derruba (não silenciar).
export function resolverPaleta(entrada = "amarelo") {
  const base = typeof entrada === "string" ? PALETAS[entrada] : { ...PALETAS.amarelo, ...entrada };
  if (!base) throw new Error(`paleta desconhecida: ${entrada} (tem: ${Object.keys(PALETAS).join(", ")})`);
  for (const k of CHAVES) {
    if (!COR.test(base[k] ?? "")) throw new Error(`cor inválida em ${k}: ${base[k]}`);
  }
  return base;
}

// CSS que sobrescreve o :root do modelo e mostra só um slide (para o print de 1080x1350).
export function cssDoSlide(paleta, rotulo) {
  const vars = CHAVES.map((k) => `--${k}:${paleta[k]}`).join(";");
  return (
    `<style>:root{${vars}}body{margin:0;overflow:hidden}` +
    `section{padding:0!important;gap:0!important}[data-screen-label]{display:none!important}` +
    `[data-screen-label="${rotulo}"]{display:block!important}</style>`
  );
}

// Lista os slides do modelo na ordem do arquivo.
export function rotulos(html) {
  return [...html.matchAll(/data-screen-label="([^"]+)"/g)].map((m) => m[1]);
}

// Injeta o CSS logo depois do <style> do modelo (dentro do helmet, que o runtime do Design respeita).
export function htmlDoSlide(html, paleta, rotulo) {
  if (!html.includes("</helmet>")) throw new Error("modelo sem <helmet>: não é um export do Claude Design");
  return html.replace("</helmet>", cssDoSlide(paleta, rotulo) + "</helmet>");
}
