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
- Front em página nova: `/Users/andrehz/Documents/Githubhz/setlists-pj-ev/colaborar.html` + um módulo
  por tela em `/Users/andrehz/Documents/Githubhz/setlists-pj-ev/colab/` (mesmo limite de 160 linhas,
  travado por `colab/colab.test.mjs` no `npm test`). CSP própria da página no `_headers`.
- Login PRÓPRIO do painel (botão do Google -> token do colaborador, chave derivada). Não usa nem
  altera o login do fórum; token de um não vale no outro (tem teste).

## Mapa

| Arquivo | Papel |
|---|---|
| `config.py` | variáveis `CONTRIB_*`, formatos e tamanhos aceitos |
| `agenda.py` | slot das :30 da próxima hora, 1 por slot, dia do limite em horário de Brasília (funções puras) |
| `r2.py` | URL pré-assinada SigV4 pro Cloudflare R2 (sem SDK) |
| `repo.py` | todo o SQL, só em `contrib_submissions` |
| `schemas.py` | contratos de entrada e saída, lista de status |
| `routes.py` | rotas de envio `/contrib/*` |
| `auth.py` | token do painel, `require_membro`, `require_admin` (admin = `CONTRIB_ADMIN_EMAILS`) |
| `membros.py` | SQL de `contrib_membros`: convite, pendente, aprovado, bloqueado |
| `google_id.py` | confere o ID token do botão do Google |
| `acesso.py` | rotas de entrar e painel de membros do admin |
| `bot.py` + `repo_bot.py` | rotas do robô de curadoria (`X-Bot-Key` = `CONTRIB_BOT_KEY`): contagem, fila, veredito, pedidos de acesso |
| `bot_falhas.py` | contador de falhas: curadoria desiste em 3, publicação em 5; envio vira recusado com motivo técnico |
| `perfil.py` | @ do Instagram opcional (`POST /contrib/perfil`), vai no crédito e marca a pessoa |
| `legenda.py` | legenda automática: WAV do navegador -> Whisper (Cloudflare Workers AI) -> trechos com tempo por palavra |

## Rotas

| Rota | O que faz |
|---|---|
| `GET /contrib/config` | limites e formatos pro front |
| `POST /contrib/entrar` | ID token do Google -> token do painel. Gmail convidado entra aprovado, o resto fica pendente |
| `GET /contrib/eu` | status de quem está logado (`pendente`, `aprovado`, `bloqueado`) e se é admin |
| `GET/POST /contrib/admin/membros` | admin convida um Gmail, aprova ou bloqueia |
| `POST /contrib/legenda` | corpo = WAV 16 kHz mono (até 6 MB), devolve trechos pra pessoa corrigir |
| `POST /contrib/uploads` | URL assinada pra subir 1 arquivo direto no R2 (15 min; tipo e tamanho travados na assinatura) |
| `POST /contrib/submissions` | cria o envio: exige aceite das regras de ouro, arquivos da pasta do próprio usuário, limite diário, agenda o slot |
| `GET /contrib/submissions/mine` | "Meus envios", com status e horário |
| `DELETE /contrib/submissions/{id}` | cancela enquanto ainda está `enviado` |
| `GET /contrib/admin/submissions` | lista geral, só admin |

Só membro `aprovado` pede upload, legenda e envia. Vídeo leva a "receita" em `video_opts`
(corte, estilo da legenda `palavra`/`faixa`/`cinema`/`nenhuma`, linhas corrigidas). O corte e a
legenda são queimados no render (fase 5), que deve seguir `colab/legendas.css`.

Status do envio: `enviado` -> `aprovado` / `ajustado` / `recusado` (curadoria IA, fase 3) -> `publicado` (fase 4).
`cancelado` e `recusado` liberam o slot.

## Curadoria por IA (fase 3)

Cron `/Users/andrehz/Documents/Githubhz/setlists-pj-ev/.github/workflows/contrib-curadoria.yml` a cada 10 min,
código em `/Users/andrehz/Documents/Githubhz/setlists-pj-ev/scripts/contrib/`:

| Arquivo | Papel |
|---|---|
| `curar.mjs` | orquestra: avisa pedidos de acesso no Telegram, pega a fila, avalia, grava o veredito |
| `midia.mjs` | fotos em 1280px; vídeo cortado no trecho escolhido, 480p, COM áudio |
| `gemini-curador.mjs` | Gemini 2.5 Flash assiste e ouve a mídia, devolve JSON estruturado |
| `prompt-curadoria.md` | o critério: regras de ouro, fatos, mexer o mínimo no texto, mensagem pra pessoa |
| `veredito.mjs` | travas por cima da IA: regra violada ou incerta recusa, sem travessão, "ajustado" só se mudou |
| `publicar.mjs` | fase 4: aprovados cujo horário chegou -> IG (capa SMUFDPJ "Comunidade" + fotos 4:5), FB e site |
| `publicar-video.mjs` | fase 5: vídeo vira Reel (render, MP4 no R2 via `/bot/render/{id}`, IG Reel com share_to_feed, FB Reel) |
| `render.mjs` | ffmpeg: corte, 1080x1920 (fundo desfocado se não for vertical), legenda queimada, voz a -14 LUFS, miniatura |
| `legenda-ass.mjs` | gera o .ass (libass) dos estilos palavra/faixa/cinema, ESPELHO de `colab/legendas.css` |
| `post.mjs` | crédito ("Marina S."), legenda do IG, item do site `colab-<8 hex>` (funções puras) |
| `api.mjs`, `git.mjs` | rotas do robô + Telegram; commit/push com retry e espera do raw do GitHub |
| `smoke.mjs` | teste real do Gemini (só voz x voz com música), `workflow_dispatch` com `smoke=true` |

Por que Gemini: ele OUVE o áudio (regra 1, música de fundo). A chave `GEMINI_API_KEY` já existe.
Falha num envio mantém ele `enviado` e ele volta na próxima rodada; o Andre recebe aviso no Telegram.
O original da pessoa fica guardado em `ai_verdict.original` quando a IA ajusta.

## Publicação (fase 4)

Mesmo cron da curadoria, passo "Publicação". Pega `/contrib/bot/prontos` (aprovado/ajustado com
horário vencido). Foto: gera os slides, commita, espera o raw do
GitHub, grava a tentativa (`/bot/publicando`) e publica o carrossel. Se uma run morrer entre o IG e
o `/bot/publicado`, a próxima procura o post pela legenda no IG antes de postar de novo. Respeita o
cooldown global do IG (`media/news/_ig-cooldown.json`). No site entra como item `group: colaborador`,
tag `comunidade`, sem link externo. Testar: `npm run mock:server` + `node mock-ig/run.mjs contrib`
com `CONTRIB_BOT_KEY` e `CONTRIB_API` apontando pra um backend falso.

Vídeo (fase 5): renderiza no próprio runner (ffmpeg do Ubuntu, com libass; fontes Archivo Black e
Instrument Serif em `media/fonts/`), sobe o MP4 pro R2 (não vai pro git) e publica como Reel. Testado
em container Debian igual ao CI contra o mock do IG. Pra ver os estilos renderizados sem publicar,
rodar `renderizar()` de `scripts/contrib/render.mjs` num Linux com ffmpeg + libass (o ffmpeg do
Homebrew no Mac vem SEM libass).

## Falhas e avisos (sem spam)

Toda falha do robô passa por `falhou()` em `scripts/contrib/api.mjs`, que registra em `/bot/falha/{id}`.
Telegram só na 1ª falha e na desistência. Ao desistir, o envio vira `recusado` com um motivo técnico
pra pessoa reenviar, e o horário fica livre.

## Limpeza do R2 (30 dias)

Regra de ciclo de vida no bucket (Cloudflare > R2 > smufdpj-contrib > Settings > Object lifecycle rules):
prefixo `contrib/`, apagar objetos após 30 dias. Os posts publicados não dependem do R2 (site usa
`media/news/img/`, IG e FB já baixaram). Em Meus envios, miniatura expirada vira o quadrado padrão.

## Pra ligar em produção (passos manuais do Andre)

1. Rodar `004_contrib_submissions.sql` no SQL Editor do Supabase.
2. Cloudflare: criar bucket R2 `smufdpj-contrib` (privado), token de API R2 com leitura e escrita
   só nesse bucket, e CORS do bucket liberando `PUT` e `GET` pra `https://setlists-pj-ev.pages.dev`.
3. Google Cloud, no mesmo OAuth client do fórum: incluir `https://setlists-pj-ev.pages.dev` em
   "Origens JavaScript autorizadas" (o botão do Google exige).
4. Cloudflare: token de API com permissão "Workers AI" (legenda automática).
5. Railway, variáveis: `CONTRIB_R2_ACCOUNT_ID`, `CONTRIB_R2_ACCESS_KEY_ID`, `CONTRIB_R2_SECRET_ACCESS_KEY`,
   `CONTRIB_CF_AI_TOKEN` (vídeo já vem ligado; `CONTRIB_VIDEO_ENABLED=false` desliga) e por último
   `CONTRIB_BOT_KEY` (qualquer segredo longo) e por último `CONTRIB_ENABLED=true`.
   Admin do painel: `CONTRIB_ADMIN_EMAILS` (padrão eng.andrehz@gmail.com).
6. GitHub, secret `CONTRIB_BOT_KEY` com o MESMO valor do Railway (liga o cron da curadoria).

## Testes e prévia local

```
cd /Users/andrehz/Documents/Githubhz/setlists-pj-ev/backend && .venv/bin/python -m pytest -q
cd /Users/andrehz/Documents/Githubhz/setlists-pj-ev && node --test colab/colab.test.mjs
```

Ver as telas sem backend: `node colab/dev/mock-api.mjs` (API falsa na 8799) + servir a raiz do repo
(`python3 -m http.server 8798`) e abrir `http://127.0.0.1:8798/colaborar.html`. Sessão de dev no
comentário do topo de `colab/dev/mock-api.mjs`.
