# x: publicação no X (@somaisumfadepj)

Módulo apartado (Regra 0). **Ainda não automático**: em teste manual (posts feitos pelo navegador com o Andre) pra
validar o formato. Quando o Andre aprovar e colocar crédito na API, liga o automático.

## Estado (2026-09-30)

- Perfil configurado (selo, capa, bio; artes em `media/marca/`, ver `docs/PLAYBOOK-IMAGENS-GOOGLE.md`).
- Conta de desenvolvedor criada (console.x.com), app com permissão **Read and write**, pay-per-use **sem crédito**.
- 4 chaves OAuth 1.0a em `/Users/andrehz/.x-api/` (local) e nos secrets `X_API_KEY`, `X_API_SECRET`,
  `X_ACCESS_TOKEN`, `X_ACCESS_SECRET`. Testado: `GET /2/users/me` responde a conta certa.
- 1º post de teste (notícia) feito à mão em 30/09.

## Arquivos

| Arquivo | Papel |
|---|---|
| `oauth1.mjs` | assinatura OAuth 1.0a (HMAC-SHA1) sem SDK |
| `texto.mjs` | texto de notícia, cápsula e reel (<= 280; sem link por padrão, API cobra ~13x mais por URL; `{ link }` no manual) |
| `kit-do-dia.mjs` | MODO MANUAL: monta `.x-kit/<dia>/` (texto com link da matéria, imagens, horário) |
| `conferir.mjs` | confere os textos finais do kit (<= 280, link, sem travessão, sem corte) |
| `ROTINA-X-HOJE.md` | passo a passo do comando `/x-hoje` (Claude agenda no X pelo navegador, Andre clica Schedule) |
| `mac/` | tarefa do Mac às 11h (launchd `com.smufdpj.x-kit`): roda o kit, avisa e abre o Claude. `instalar.sh` / `desinstalar.sh` |

## Modo manual (atual, grátis)

Às 11h o Mac monta o kit (notícias das últimas 24h, máx. 4, às 12/14/16/18h + cápsula do dia às 20h05), toca o aviso e
abre o Claude com `/x-hoje`. Ele agenda cada post no agendador nativo do X; o Andre só clica em Schedule. Dia sem
sessão é descartado. Só a 1a notícia do dia leva o link da matéria (o X entrega menos post com link); as outras e a cápsula dizem "link na bio". Teste desde 2026-09-30: rever com as estatísticas do X.
O comando `/x-hoje` vive em `.claude/commands/x-hoje.md` (gitignored). Se sumir, recriar com uma linha: "Siga
exatamente as instruções de scripts/publish/x/ROTINA-X-HOJE.md". Validar textos: `node scripts/publish/x/conferir.mjs`.
Log: `/Users/andrehz/Library/Logs/smufdpj-x-kit.log`. Estado (ids já usados): `/Users/andrehz/.smufdpj-x-kit.json`.

## Plano do automático (aprovado em conceito)

- Notícia: 1 post por notícia (card + manchete + intro + "Matéria completa no site (link na bio)").
- Cápsula: 1 post com até 4 imagens (capa + 3 citações).
- Reel: o vídeo narrado, domingo.
- Flag `X_PUBLICAR`; o X posta DEPOIS do Instagram e nunca derruba a publicação; registro anti-duplicado.
- Custo estimado US$ 3 a 6/mês; crédito sem recarga automática.

## Regras

- Não postar pelo navegador de forma automática (política de automação do X; só API). Post manual pelo navegador
  só com o Andre junto.
- Premium do X: avaliar depois de ter público (monetização tornaria o uso comercial: ElevenLabs precisaria de plano pago).
