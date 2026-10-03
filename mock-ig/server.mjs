// Mock da Graph API do Instagram (graph.instagram.com/v21.0).
//
// GENERICO E REUTILIZAVEL: nao depende deste projeto. Qualquer app que
// publique no IG via Graph API (carrossel, single, story) pode apontar pra
// ca setando IG_API_BASE + REPO_PUBLIC_BASE. Veja mock-ig/README.md.
//
// Tres papeis numa porta so:
//   1. Graph API fake: POST /media, /media_publish, GET /content_publishing_limit,
//      GET /:id (status de container OU exists de post), GET /me
//   2. Servidor de media do disco: GET /media/... (substitui raw.githubusercontent,
//      pra o "IG" buscar os JPG/MP4 que o app gerou localmente)
//   3. API do front: GET /_mock/feed|stories|state, POST /_mock/reset|fail|delete
//
// Config por env (todas opcionais, defaults sensatos):
//   MOCK_IG_PORT       porta (default 8788)
//   MOCK_SERVE_ROOT    raiz de onde servir media do disco (default cwd)
//   MOCK_IG_STORE      caminho do _store.json (default ao lado deste arquivo)
//   MOCK_IG_FAIL       modo de falha sticky (ver injecao de erro abaixo)
import http from "node:http";
import { PORT, SERVE_ROOT, send, sendJson } from "./http-util.mjs";
import { STORE_PATH } from "./store.mjs";
import { rotasMock } from "./rotas-mock.mjs";
import { rotasMockSim } from "./rotas-mock-sim.mjs";
import { rotasIg } from "./rotas-ig.mjs";
import { rotasIgGet } from "./rotas-ig-get.mjs";
import { rotasFb } from "./rotas-fb.mjs";
import { rotasEstatico } from "./rotas-estatico.mjs";

// Rotas por ordem de prioridade; cada grupo devolve true quando atendeu a requisição.
const GRUPOS = [rotasMock, rotasMockSim, rotasIg, rotasFb, rotasIgGet, rotasEstatico];

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const c = { req, res, pathname: u.pathname, query: Object.fromEntries(u.searchParams), method: req.method };
  if (c.method === "OPTIONS") return send(res, 204, "");
  try {
    for (const grupo of GRUPOS) if (await grupo(c)) return;
    return sendJson(res, 404, { error: { message: "mock: rota nao mapeada " + c.method + " " + c.pathname, code: 0 } });
  } catch (e) {
    return sendJson(res, 500, { error: { message: "mock crash: " + e.message, code: 0 } });
  }
});
// Exporta pra ser embutido em teste (porta efemera) ou rodado direto.
export function start(port = PORT) {
  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => {
      const actual = server.address().port;
      console.log(`[mock-ig] Graph API fake em http://127.0.0.1:${actual}`);
      console.log(`[mock-ig] serve media de: ${SERVE_ROOT}`);
      console.log(`[mock-ig] store: ${STORE_PATH}`);
      resolve(server);
    });
  });
}

// Rodado direto (node mock-ig/server.mjs) sobe o server. Importado, nao.
const invokedDirectly = process.argv[1] && process.argv[1].endsWith("server.mjs");
if (invokedDirectly) start();

export { server };
