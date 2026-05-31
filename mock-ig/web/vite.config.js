import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy /_mock e /media pro mock server (porta 8788 por padrao), pra evitar
// CORS no dev. Em build, o mesmo server serve o dist/ e tudo fica same-origin.
const MOCK = process.env.MOCK_IG_URL || "http://127.0.0.1:8788";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5273,
    proxy: {
      "/_mock": MOCK,
      "/media": MOCK,
    },
  },
  build: { outDir: "dist" },
});
