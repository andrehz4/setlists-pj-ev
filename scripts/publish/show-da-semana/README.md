# Show da Semana (carrossel de um show por post)

Série de carrossel inspirada no formato do @liveon4legspodcast (só o formato; design e textos são nossos).
Um show por post, numerado ("Show #N"), sempre com a mesma moldura pra o grid do perfil virar coleção.
Módulo apartado (Regra 0): nada aqui roda sozinho nem publica; só monta e valida a ficha.

**De onde vem cada dado e como baixar de novo (pôsteres, fórum, setlist.fm): leia `FONTES.md` nesta pasta.**

## Os 4 slides (1080x1350)

1. **Capa**: moldura fixa da marca, selo no topo, pôster no centro (crédito do artista embaixo, pequeno),
   "SHOW #N", cidade grande, data por extenso em PT-BR ("15 de novembro de 1996").
2. **A história da noite**: título curto + texto de até 900 caracteres. Só fato com fonte.
3. **Setlist**: duas colunas, show e bis. Destaques (estreia, raridade, cover) marcados com um sinal discreto.
4. **Fecho**: "Segue a gente", link da página do show no site quando existir (`/show/<id>.html`).

## Ritmo e material (rode `node scripts/publish/show-da-semana/cli.mjs folego`)

- 25 shows do site já têm pôster e setlist no repo (`media/<id>/poster.jpg`, `dados/shows.js`):
  são ~6 meses a 1 por semana sem nenhuma pesquisa de imagem.
- O acervo do setlist.fm (`media/setlistfm/`) tem 1447 setlists com show e bis separados: matéria-prima
  pra shows históricos (Praga 96, Off Ramp 91, Pinkpop 92...). Esses precisam de pôster e história pesquisados.
- Ritmo recomendado: **1 por semana**, intercalando show do Brasil (material pronto) e show histórico
  (pesquisa). Assim a reserva de prontos dura ~1 ano e dá tempo de pesquisar os históricos com calma.
- O gargalo é a história com fonte, não o setlist. Show sem história boa não entra.

## Fluxo

1. `node scripts/publish/show-da-semana/cli.mjs novo pj:1996-11-15` cria
   `media/show-da-semana/fichas/pj-1996-11-15.json` com setlist, local, data e pôster (se houver no repo).
2. Preencher a ficha: `poster`, `historia` (título, texto, fontes com url e trecho), `destaques`, `legenda`.
3. `node scripts/publish/show-da-semana/cli.mjs checar` até não sobrar erro.
4. Mostrar ao dono da página; só ele muda `status` pra `aprovado`.
5. Render: `node scripts/publish/show-da-semana/render.mjs <pasta-saida> <ficha.json>` gera 01..04.jpg com o
   modelo do Claude Design (`media/carrossel/show/modelo.html`, aprovado em 25/11/2026; mudar layout = mandar
   de volta pro Design). `setlist.blocos` ([{label:"SHOW",songs:[]},{label:"BIS 1",...}]) manda nos blocos;
   música em `destaques` sai em amarelo; cover = "(Autor)" no fim do nome.
   Publicação: fluxo de carrossel especial de `scripts/publish/carrossel/README.md` (publicar.json + TriggerAll).
   Depois de postar, `status` vira `publicado`.

## Fonte principal: Fanviews do fórum oficial (community.pearljam.com)

O fórum oficial do Pearl Jam tem, pra quase todo show desde ~2003, um tópico "<Cidade> Fanviews Here <data>"
aberto pela moderação (usuário Sea) na seção "Given To Fly (live)". O 1º post traz setlist, horário de
entrada e saída do palco, música de entrada e **notas do que aconteceu entre as músicas** (o que o Eddie falou,
estreias, quem subiu no palco, bandeira, recado pra plateia). É a melhor matéria-prima pra "a história da noite".
Exemplo: Porto Alegre 11/11/2015, discussão 247825 (Comfortably Numb com o Eddie no piano, parabéns pra Jill
cantado em português pela plateia, baqueta entregue pra um fã).

- Precisa de login: só dá pra ler pelo Chrome do dono da página (Claude in Chrome), que já está logado.
  Ler com `get_page_text`; nunca postar, curtir, responder nem mexer na conta.
- Achar: busca do fórum `<cidade> fanviews` ou `fanviews <país>`; o título tem a data em formato americano.
- Na ficha: `url` do tópico (`https://community.pearljam.com/discussion/<id>`) e o trecho em inglês das notas.
  Traduza com suas palavras; nada de colar o texto dos fãs.
- Shows antes de ~2003 não têm Fanviews: aí vale setlist.fm (notas), pearljam.com, Wikipedia e imprensa.

## Regras para agentes de IA (obrigatórias)

- **Fonte em tudo**: cada frase da história precisa de uma fonte em `historia.fontes` (url + trecho copiado
  da fonte). Valem: pearljam.com, setlist.fm (notas do show), Wikipedia com referência, entrevista, livro,
  jornal da época, e o 1º post do tópico de Fanviews do fórum oficial (ver abaixo). Comentário de fã em
  fórum só como pista, ou citado como "relato de fã" sem nome de usuário. Sem fonte, a frase sai.
- **Não inventar**: público, duração, clima, "noite histórica", recorde, primeira vez. Só se a fonte disser.
  Citação entre aspas só se a fonte trouxer a frase exata. Na dúvida, escreva menos.
- **Setlist vem do acervo**, nunca de memória. Divergência entre setlist.fm e `dados/shows.js`: vale o do site
  (conferido pelo dono) e anote a diferença no relatório.
- **Pôster**: preferir o do repo. De fora, só pôster oficial do show, sempre com o nome do artista em
  `poster.credito` (ou "pôster oficial" se não houver artista). Nunca gerar pôster nem foto de pessoa real por
  IA. Show sem pôster usa ingresso ou foto da noite com crédito. Imagem de terceiro não entra no git
  (repo público): guarde fora do git e aponte o caminho.
- **Escrita**: PT-BR com acento, NUNCA travessão, tom de fã que conta pra outro fã (ver
  `scripts/news/prompts/voz-humana-ptbr.md`; skill humanizer-ptbr se disponível). Nunca o nome do dono da
  página em texto público. Nome de música e de turnê em inglês, como no disco.
- **Nada de copiar** texto, layout ou arte do Live on 4 Legs nem de outra página. Pode citá-los como fonte
  de pista, nunca reproduzir.
- **Não publicar, não aprovar, não commitar** sem o dono pedir. O agente entrega a ficha em `rascunho` com
  `checar` limpo e um relatório curto: show, fontes usadas, dúvidas.
- **Numeração**: `novo` pega o próximo número sozinho. Não renumerar ficha publicada.

## Arquivos

- `forum.mjs`: coleta os Fanviews do fórum (API pública) em `media/show-da-semana/forum/<ano>.json`.
- `oficial.mjs`: coleta o histórico do pearljam.com (pôster, artista, sets) em `media/show-da-semana/oficial/`;
  `--posters` baixa todos os pôsteres pra `media/show-da-semana/posters/` (fora do git).
- `render.mjs`: ficha -> 4 JPGs pelo modelo do Design.

- `acervo.mjs`: lê setlist.fm, `dados/shows.js` e a mídia do repo; `folego()` conta o material.
- `ficha.mjs`: rascunho, validação das regras acima, numeração.
- `cli.mjs`: `folego`, `novo`, `checar`. Testes em `ficha.test.mjs`.
- Fichas: `media/show-da-semana/fichas/<id>.json` (texto com fonte, vai pro git; imagens não).
