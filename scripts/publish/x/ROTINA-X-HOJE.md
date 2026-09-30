# Rotina /x-hoje: agendar no X os posts do dia (modo manual)

Instruções pro Claude. O Mac roda o kit às 11h (`scripts/publish/x/mac/`), avisa e abre o Claude com `/x-hoje`.
O Andre só clica em **Schedule** em cada post. Publicar é sempre decisão dele: eu monto, ele confirma.

## Passos

1. Ler o kit do dia: `.x-kit/<AAAA-MM-DD>/kit.json` (data BRT de hoje). Se não existir, rodar
   `node scripts/publish/x/kit-do-dia.mjs`. Se `posts` vier vazio: avisar "nada pra postar hoje" e parar.
2. **Otimizar os textos** (o texto do kit é só um corte automático do site, não é o final). Pra cada post:
   - Ler a matéria (`media/news/items/<id>.json`, ou o rascunho da cápsula) e o guia `scripts/news/prompts/voz-humana-ptbr.md`.
   - Reescrever CONDENSADO pro X: 1 linha de gancho (não repetir o título do site ao pé da letra) + 1 ou 2 frases curtas
     com o fato principal. Fiel à matéria: não inventar nada, não afirmar o que a matéria trata como boato.
   - Link SÓ no post com `comLink: true` (a 1a notícia do dia): `Matéria completa: <link>`. Os outros fecham com
     `Matéria completa no site (link na bio).` (cápsula: `A cápsula completa está no site (link na bio).`). Sempre
     `#PearlJam #EddieVedder` no fim. Motivo: o X entrega menos post com link; é teste, rever com as estatísticas.
   - Sem travessão, sem "…", sem emoji em excesso (no máximo 1). Link conta 23 caracteres; limite 280.
   - Notícias do mesmo assunto no mesmo dia: ângulos diferentes, sem repetir a mesma frase.
   - Gravar no `kit.json` (campo `texto`) e rodar `node scripts/publish/x/conferir.mjs`: tudo tem que dar `ok`.
3. Mostrar ao Andre a lista com o texto FINAL de cada post (horário, texto, nº de imagens) e esperar o ok dele.
   Se ele pedir ajuste, reescrever e conferir de novo.
4. Chrome: `tabs_context_mcp` e usar a aba do grupo. Ir em `https://x.com/home` (usar a caixa de post da PÁGINA
   INICIAL; `/compose/post` abre duas caixas e confunde). Conferir que está logado como @somaisumfadepj.
5. Pra cada post, na ordem:
   - `find` "Post text editor, Add photos or video file input, Schedule post button" na caixa da página inicial.
   - `file_upload` das `imagens` do post no input de mídia (os arquivos ficam no repo, permitido).
   - Clicar no texto e digitar `texto` (quebras de linha funcionam com `\n`).
   - Abrir o agendamento (ícone de calendário da caixa). Com `find` pegar os selects Month/Day/Year/Hour/Minute e usar
     `form_input`: dia de hoje, `horario` do post (Hour 0-23, Minute sem zero à esquerda, ex: "5").
   - Conferir o texto "Will send on ... at H:MM PM" com `zoom` e clicar em **Confirm**.
   - Tocar o aviso (`afplay /System/Library/Sounds/Glass.aiff`) e pedir: "clique em **Schedule**". Esperar o ok.
6. Se o horário do post já passou (Andre abriu tarde): perguntar se agenda pra daqui a 10 min ou pula aquele post.
7. No fim, abrir a lista de agendados (`https://x.com/compose/post/unsent/scheduled`), conferir e resumir.

## Lições (não redescobrir)

- Depois de subir a imagem e digitar, o layout da caixa muda: clicar no Schedule com ref antiga ou coordenada velha
  acerta o botão "Edit" da imagem (abre "Crop media"). Se abrir, voltar com a seta SEM salvar. Sempre refazer o `find`
  do "Schedule post" e esperar 1 a 2 s antes de procurar os selects do agendamento.
- O `find` às vezes não enxerga o diálogo recém-aberto: tirar um screenshot e repetir o `find`.
- Pro upload usar o `input type=file` (o `find` devolve como "button ... (file)"), nunca clicar no ícone de foto
  (abre o seletor do sistema, que eu não controlo).
- Link comprido quebra linha na caixa do X: é só visual, não é erro.
- Kit de TESTE sem mexer no controle real: `HOME=<pasta do scratchpad> node scripts/publish/x/kit-do-dia.mjs`.

## Regras

- Nunca clicar em Post/Schedule sozinho: o X proíbe automação pelo site (só API) e pode limitar ou suspender a conta.
  O clique final do Andre torna o post humano. Nunca postar sem o kit: imagem vem do kit; texto é a versão otimizada que o Andre aprovou.
- O X NÃO grava imagem de PERFIL enviada por upload automático; imagem de POST funciona.
- Dia sem sessão é descartado: o kit só pega as últimas 24h (máx. 4 notícias), não acumula.
- Não usar a API paga (sem crédito). O automático via API é outra etapa (ver README).
