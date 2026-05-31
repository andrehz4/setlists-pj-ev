// Roda o pipeline REAL de publicacao contra o mock, setando as envs que
// apontam a Graph API e o fetch de media pro server local. Cross-plataforma
// (nao depende de cross-env). Uso:
//   node mock-ig/run.mjs feed    -> run-publish.mjs (carrossel/single)
//   node mock-ig/run.mjs story   -> run-publish-story.mjs
//
// Pressupoe o mock server rodando (npm run mock:server) na MOCK_IG_PORT.

const PORT = process.env.MOCK_IG_PORT || "8788";
const base = `http://127.0.0.1:${PORT}`;

process.env.IG_API_BASE ||= base;
process.env.REPO_PUBLIC_BASE ||= base; // o "IG" busca os slides/MP4 do mock
process.env.IG_USER_ID ||= "mock_user";
process.env.IG_ACCESS_TOKEN ||= "mock_token";

const mode = process.argv[2] === "story" ? "story" : "feed";
// passa o resto dos args (ex: --max-batches=2) pro pipeline; --no-git sempre
// (os slides ficam no disco e o mock serve de la, nada vai pro github).
const passthrough = process.argv.slice(3);
process.argv = [process.argv[0], process.argv[1], "--no-git", ...passthrough];

console.log(`[mock-ig/run] modo=${mode} IG_API_BASE=${base} (--no-git forcado)`);

if (mode === "story") {
  await import("../scripts/publish/run-publish-story.mjs");
} else {
  await import("../scripts/publish/run-publish.mjs");
}
