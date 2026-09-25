# Colaboradores (backend/app/contrib)

Fãs enviam posts (foto, texto e, depois, vídeo com legenda automática) pelo site. A curadoria por IA
aprova sem revisão humana, e o post sai no site e no IG sempre às :30 da próxima hora.

## Regra 0 (inegociável)

- Módulo **apartado**. Não altera nenhuma rota, tabela ou tela do fórum/site que já existe.
- Único ponto de encaixe: 6 linhas no fim de `backend/app/main.py`, que só montam `/contrib`
  com `CONTRIB_ENABLED=true`. Sem a flag, o app é idêntico ao de antes (tem teste disso).
- Migração só com tabela nova (`backend/migrations/004_contrib_submissions.sql`).
- Código IA friendly: cada `.py` desta pasta tem no máximo **160 linhas**, travado por
  `backend/tests/test_contrib_puro.py::test_regra_zero_arquivos_curtos`. Passou disso, quebrar em módulo.
- Front vai em página nova (`colaborar.html`), sem mexer no `index.html`.

## Mapa

| Arquivo | Papel |
|---|---|
| `config.py` | variáveis `CONTRIB_*`, formatos e tamanhos aceitos |
| `agenda.py` | slot das :30 da próxima hora, 1 por slot, dia do limite em horário de Brasília (funções puras) |
| `r2.py` | URL pré-assinada SigV4 pro Cloudflare R2 (sem SDK) |
| `repo.py` | todo o SQL, só em `contrib_submissions` |
| `schemas.py` | contratos de entrada e saída, lista de status |
| `routes.py` | rotas de envio `/contrib/*` |
| `membros.py` | acesso só por convite: pendente, aprovado, bloqueado; dependência `require_membro` |
| `google_id.py` | confere o ID token do botão do Google (prova o Gmail sem mexer no login do fórum) |
| `acesso.py` | rotas de pedir acesso e painel de membros do admin |

## Rotas

| Rota | O que faz |
|---|---|
| `GET /contrib/config` | limites e formatos pro front |
| `GET /contrib/acesso` | status do acesso de quem está logado (`nenhum`, `pendente`, `aprovado`, `bloqueado`) |
| `POST /contrib/acesso` | confirma o Gmail (ID token do Google). Gmail convidado entra aprovado, o resto fica pendente |
| `GET/POST /contrib/admin/membros` | admin convida um Gmail, aprova ou bloqueia |
| `POST /contrib/uploads` | URL assinada pra subir 1 arquivo direto no R2 (15 min; tipo e tamanho travados na assinatura) |
| `POST /contrib/submissions` | cria o envio: exige aceite das regras de ouro, arquivos da pasta do próprio usuário, limite diário, agenda o slot |
| `GET /contrib/submissions/mine` | "Meus envios", com status e horário |
| `DELETE /contrib/submissions/{id}` | cancela enquanto ainda está `enviado` |
| `GET /contrib/admin/submissions` | lista geral, só admin |

Só membro `aprovado` pede upload e envia. O Gmail precisa ser confirmado uma vez, porque o login
do fórum não guarda e-mail e a regra 0 não deixa mexer nele.

Status do envio: `enviado` -> `aprovado` / `ajustado` / `recusado` (curadoria IA, fase 3) -> `publicado` (fase 4).
`cancelado` e `recusado` liberam o slot.

## Pra ligar em produção (passos manuais do Andre)

1. Rodar `004_contrib_submissions.sql` no SQL Editor do Supabase.
2. Cloudflare: criar bucket R2 `smufdpj-contrib` (privado), token de API R2 com leitura e escrita
   só nesse bucket, e CORS do bucket liberando `PUT` e `GET` pra `https://setlists-pj-ev.pages.dev`.
3. Google Cloud, no mesmo OAuth client do fórum: incluir `https://setlists-pj-ev.pages.dev` em
   "Origens JavaScript autorizadas" (o botão do Google exige).
4. Railway, variáveis: `CONTRIB_R2_ACCOUNT_ID`, `CONTRIB_R2_ACCESS_KEY_ID`, `CONTRIB_R2_SECRET_ACCESS_KEY`
   e por último `CONTRIB_ENABLED=true`.

## Testes

```
cd /Users/andrehz/Documents/Githubhz/setlists-pj-ev/backend && .venv/bin/python -m pytest -q
```
