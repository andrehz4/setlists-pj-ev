# Rotina /x-hoje: agendar no X os posts do dia (modo manual)

Instruções pro Claude. O Mac roda o kit às 11h (`scripts/publish/x/mac/`), avisa e abre o Claude com `/x-hoje`.
O Andre só clica em **Schedule** em cada post. Publicar é sempre decisão dele: eu monto, ele confirma.

## Passos

1. Ler o kit do dia: `.x-kit/<AAAA-MM-DD>/kit.json` (data BRT de hoje). Se não existir, rodar
   `node scripts/publish/x/kit-do-dia.mjs`. Se `posts` vier vazio: avisar "nada pra postar hoje" e parar.
2. Mostrar ao Andre a lista (ordem, horário, primeira linha do texto, nº de imagens) antes de começar.
3. Chrome: `tabs_context_mcp` e usar a aba do grupo. Ir em `https://x.com/home` (usar a caixa de post da PÁGINA
   INICIAL; `/compose/post` abre duas caixas e confunde). Conferir que está logado como @somaisumfadepj.
4. Pra cada post, na ordem:
   - `find` "Post text editor, Add photos or video file input, Schedule post button" na caixa da página inicial.
   - `file_upload` das `imagens` do post no input de mídia (os arquivos ficam no repo, permitido).
   - Clicar no texto e digitar `texto` (quebras de linha funcionam com `\n`).
   - Abrir o agendamento (ícone de calendário da caixa). Com `find` pegar os selects Month/Day/Year/Hour/Minute e usar
     `form_input`: dia de hoje, `horario` do post (Hour 0-23, Minute sem zero à esquerda, ex: "5").
   - Conferir o texto "Will send on ... at H:MM PM" com `zoom` e clicar em **Confirm**.
   - Tocar o aviso (`afplay /System/Library/Sounds/Glass.aiff`) e pedir: "clique em **Schedule**". Esperar o ok.
5. Se o horário do post já passou (Andre abriu tarde): perguntar se agenda pra daqui a 10 min ou pula aquele post.
6. No fim, abrir a lista de agendados (`https://x.com/compose/post/unsent/scheduled`), conferir e resumir.

## Regras

- Nunca clicar em Post/Schedule sozinho. Nunca postar sem o kit (texto e imagem vêm do kit, não improvisar).
- O X NÃO grava imagem de PERFIL enviada por upload automático; imagem de POST funciona.
- Dia sem sessão é descartado: o kit só pega as últimas 24h (máx. 4 notícias), não acumula.
- Não usar a API paga (sem crédito). O automático via API é outra etapa (ver README).
