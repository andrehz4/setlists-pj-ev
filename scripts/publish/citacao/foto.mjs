// Slide de FOTO no carrossel da cápsula (item { tipo: "foto", img, texto }): mesmo molde da capa do dia,
// com a legenda curta no lugar do título. Serve pra mostrar o objeto da história (guitarra, setlist).
import { buildCoverSlide } from "../slide-image.mjs";

export const ehFoto = (c) => c?.tipo === "foto" && !!c.img;

export function buildFotoSlide(cap, c, destId, cor) {
  return buildCoverSlide({ id: destId, title_pt: c.texto, img: c.img, tags: cap.tags, kind: "youtube", url: "" }, destId, cor);
}
