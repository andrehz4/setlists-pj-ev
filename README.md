# Só Mais um Fã de Pearl Jam

Site fan-to-fan de Pearl Jam e Eddie Vedder (https://somaisumfadepearljam.com.br) com pipeline autônomo de notícias
que coleta, cura e publica no Instagram @smufdpj, no Facebook e no site. Tudo em PT-BR.

- **Mapa do projeto (pra pessoas e agentes de IA):** [`CLAUDE.md`](CLAUDE.md). Comece por ele.
- **Estado atual e últimas sessões:** [`PROGRESSO.md`](PROGRESSO.md). Histórico em [`docs/progresso/`](docs/progresso/).
- **Fluxo de notícias em detalhe:** [`PIPELINE.md`](PIPELINE.md).
- **Backend do fórum (FastAPI no Railway):** [`backend/DEPLOY-RAILWAY.md`](backend/DEPLOY-RAILWAY.md).
- **Saúde do projeto (última vistoria):** [`docs/VISTORIA-2026-10-02.md`](docs/VISTORIA-2026-10-02.md).

## Rodar

```
npm ci
npm run dev            # site local
npm test               # suíte completa (node --test), rodar antes de todo push de scripts
npm run mock:server    # Instagram fake na :8788 pra testar publicação sem tocar no IG real
```

Deploy do site: automático no push da `main` (Cloudflare Pages). Os robôs rodam no GitHub Actions
(`.github/workflows/`). Segredos ficam só nos GitHub Secrets e no painel do Railway, nunca no repo.
