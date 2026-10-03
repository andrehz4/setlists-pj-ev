// Gerador de slides do feed do Instagram (1080x1350, 4:5). Fachada: o código vive em scripts/publish/slide/
//   base.mjs     medidas, pasta, layout, helpers       texto.mjs   quebra de linha, auto-fit, medida real
//   imagem.mjs   escolha da foto (override > local > URL > assunto > banda) e detecção de rosto
//   foto.mjs     recorte (rosto > smartcrop > attention) e tratamento por resolução
//   card02.mjs   slide de notícia (padrão)              capa.mjs    capa do carrossel (card11 + estilos)
//   capsula.mjs  citação e CTA das cápsulas             cadernob.mjs layout antigo (rollback)
// Layout por SLIDE_LAYOUT: "card02" (padrão desde 2026-05-16) ou "cadernob". Cache por layout.
import { LAYOUT, SLIDES_DIR, ensureSlidesDir } from "./slide/base.mjs";
import { buildCard02Slide } from "./slide/card02.mjs";
import { buildCadernoBSlide } from "./slide/cadernob.mjs";

export { LAYOUT, SLIDES_DIR, ensureSlidesDir };
export { fitHeadline, measureText } from "./slide/texto.mjs";
export { buildCoverSlide } from "./slide/capa.mjs";
export { capsuleColors, buildQuoteSlide, buildCtaSlide } from "./slide/capsula.mjs";

// outDir opcional (padrão SLIDES_DIR): o preview gera numa pasta separada sem sujar a produção.
export async function buildSlide(item, { outDir } = {}) {
  await ensureSlidesDir();
  return LAYOUT === "card02" ? buildCard02Slide(item, { outDir }) : buildCadernoBSlide(item, { outDir });
}

// Um slide por item; item que falha fica de fora (o publish marca erro nele).
export async function buildSlides(items, opts = {}) {
  const out = [];
  for (const it of items) {
    try {
      const r = await buildSlide(it, opts);
      out.push({ id: it.id, path: r.path, reused: r.reused });
    } catch (e) {
      console.warn(`[slide] falha em ${it.id}: ${e.message}`);
    }
  }
  return out;
}
