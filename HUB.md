# HUB.md

Este projeto está catalogado no Hub HZ, o painel central de todos os apps do Andre:
`/Users/andrehz/Documents/Githubhz/hub-hz` (produção: https://hub-hz.vercel.app).

Ao mudar URL de deploy, porta local ou comando de rodar deste app, atualizar a
entrada correspondente em `hub-hz/api/_lib/catalog.js` (campos status/url/
localUrl/comoRodar) e dar push do hub-hz (deploy automático na Vercel).

Dados deste app:
- Produção: https://setlists-pj-ev.pages.dev (Cloudflare Pages, push na main)
- Backend fórum: Railway (perpetual-energy-production-1a69.up.railway.app)
- Rodar local: `npm run dev` (devserver estático)
