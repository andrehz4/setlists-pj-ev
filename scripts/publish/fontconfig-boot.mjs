// Bootstrap de fontes (side-effect no import). libvips/pango resolve
// familia via fontconfig. Embarcamos .ttf OFL em media/fonts/ e geramos
// um fonts.conf com path ABSOLUTO em tmp, apontando FONTCONFIG_FILE/PATH
// pra ele. Path absoluto em runtime funciona igual no Windows (preview
// local) e no Ubuntu do CI. fontconfig inicializa lazy no primeiro
// render de texto, entao basta este modulo ser importado ANTES de sharp.
//
// Fonte unica usada por slide-image.mjs (carrossel/capa) e
// story-video.mjs (story). Importar com `import "./fontconfig-boot.mjs"`
// (side-effect) ou desestruturando as familias F_*.

import os from "node:os";
import path from "node:path";
import fssync from "node:fs";

export const FONTS_DIR = path.resolve("media/fonts");

(function bootstrapFontconfig() {
  try {
    if (!fssync.existsSync(FONTS_DIR)) return;
    const fcDir = path.join(os.tmpdir(), "smufdpj-fontconfig");
    const cacheDir = path.join(fcDir, "cache");
    fssync.mkdirSync(cacheDir, { recursive: true });
    const conf = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${FONTS_DIR.replace(/\\/g, "/")}</dir>
  <cachedir>${cacheDir.replace(/\\/g, "/")}</cachedir>
  <include ignore_missing="yes">/etc/fonts/fonts.conf</include>
</fontconfig>
`;
    const confPath = path.join(fcDir, "fonts.conf");
    fssync.writeFileSync(confPath, conf);
    process.env.FONTCONFIG_FILE = confPath;
    process.env.FONTCONFIG_PATH = fcDir;
  } catch (e) {
    console.warn(`[fonts] bootstrap fontconfig falhou (segue com fonte de sistema): ${e.message}`);
  }
})();

// Familias exatas (name table dos .ttf do fontsource: peso embutido na
// familia pros nao-Regular/Bold, por isso referencia a string literal).
export const F_ANTON    = "'Anton','Impact',sans-serif";
export const F_INTER    = "'Inter',system-ui,sans-serif";
export const F_INTER_SB = "'Inter SemiBold','Inter',system-ui,sans-serif";
export const F_INTER_XB = "'Inter ExtraBold','Inter',system-ui,sans-serif";
export const F_PLAYFAIR = "'Playfair Display Black','Playfair Display',Georgia,serif";
