import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy /_mock e /media pro mock server (porta 8788 por padrao), pra evitar
// CORS no dev. Em build, o mesmo server serve o dist/ e tudo fica same-origin.
const MOCK = process.env.MOCK_IG_URL || "http://127.0.0.1:8788";

// carimbo de build (data/hora BRT) injetado no bundle, pra a sidebar mostrar
// a versao e o Andre saber se o deploy/reload subiu certo.
const stamp = new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(2, 16).replace("T", " ");

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD__: JSON.stringify(stamp),
  },
  server: {
    port: 5273,
    proxy: {
      "/_mock": MOCK,
      "/media": MOCK,
    },
  },
  build: { outDir: "dist" },
});
