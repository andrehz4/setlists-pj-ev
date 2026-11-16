// D1 de mentira em memória pros testes do contador: entende o upsert e as leituras da tabela contador e o
// INSERT/SELECT da tabela nomes. `semTabela: true` simula o banco novo, sem a tabela nomes criada.
export function bancoFalso({ semTabela = false } = {}) {
  const linhas = new Map(), nomes = [], sqls = [];
  let temNomes = !semTabela;
  const falta = () => { if (!temNomes) throw new Error("D1_ERROR: no such table: nomes: SQLITE_ERROR"); };
  const prepare = (sql) => ({
    args: [],
    bind(...a) { this.args = a; return this; },
    async run() {
      sqls.push(sql);
      if (sql.startsWith("CREATE TABLE IF NOT EXISTS nomes")) { temNomes = true; return; }
      if (sql.startsWith("INSERT INTO nomes")) {
        falta();
        for (let i = 0; i < this.args.length; i += 6) {
          const [nome, barrado, noite, evento, dentro_app, quando] = this.args.slice(i, i + 6);
          nomes.push({ id: nomes.length + 1, nome, barrado, noite, evento, dentro_app, quando });
        }
        return;
      }
      for (const k of this.args) linhas.set(k, (linhas.get(k) || 0) + 1);
    },
    async all() {
      if (sql.includes("FROM nomes")) {
        falta();
        if (sql.includes("COUNT(")) {
          const bons = new Set(nomes.filter((n) => !n.barrado).map((n) => n.nome.toLowerCase()));
          return { results: [{ distintos: bons.size, barrados: nomes.filter((n) => n.barrado).length }] };
        }
        return { results: [...nomes].reverse().slice(0, 100).map(({ id, ...r }) => r) };
      }
      const de = this.args[0] ?? "d:", ate = sql.includes("'h;'") ? "h;" : "d;";
      return { results: [...linhas].filter(([k]) => k >= de && k < ate).map(([chave, n]) => ({ chave, n })) };
    },
  });
  return { linhas, nomes, sqls, prepare };
}
