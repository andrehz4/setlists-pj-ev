// Lê os posts públicos de uma conta (workflow manual agenda-poc.yml, pra avaliar banda nova antes de entrar
// na lista). Uso: IG_LEITURA_TOKEN=... node scripts/agenda/poc-ig.mjs <conta> [n]
import { lerConta } from "./ler-instagram.mjs";

const conta = (process.argv[2] || "").replace(/^@/, "");
if (!conta) {
  console.error("uso: IG_LEITURA_TOKEN=... node scripts/agenda/poc-ig.mjs <conta> [n]");
  process.exit(2);
}
try {
  const r = await lerConta(conta, { n: Math.min(Number(process.argv[3]) || 25, 50) });
  console.log(JSON.stringify({ conta: r.conta, nome: r.nome, seguidores: r.seguidores,
    ultimos: r.posts.map((p) => ({ data: p.data, link: p.link, legenda: p.legenda })) }, null, 2));
} catch (e) {
  console.error(`[agenda-poc] falhou: ${e.message}`);
  process.exit(1);
}
