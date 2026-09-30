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
| `texto.mjs` | texto de notícia, cápsula e reel (<= 280, SEM LINK: post com URL custa ~13x mais) |

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
