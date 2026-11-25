# Show da Semana (carrossel de um show por post)

Série de carrossel inspirada no formato do @liveon4legspodcast (só o formato; design e textos são nossos).
Um show por post, numerado ("Show #N"), sempre com a mesma moldura pra o grid do perfil virar coleção.
Módulo apartado (Regra 0): nada aqui roda sozinho nem publica; só monta e valida a ficha.

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
5. Render e publicação: modelo do Claude Design (a fazer) + `scripts/publish/carrossel/render.mjs` e o fluxo
   de carrossel especial descrito em `scripts/publish/carrossel/README.md` (publicar.json + TriggerAll).
   Depois de postar, `status` vira `publicado`.

## Regras para agentes de IA (obrigatórias)

- **Fonte em tudo**: cada frase da história precisa de uma fonte em `historia.fontes` (url + trecho copiado
  da fonte). Valem: pearljam.com, setlist.fm (notas do show), Wikipedia com referência, entrevista, livro,
  jornal da época. Fórum e comentário de fã só como pista, nunca como fonte. Sem fonte, a frase sai.
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

- `acervo.mjs`: lê setlist.fm, `dados/shows.js` e a mídia do repo; `folego()` conta o material.
- `ficha.mjs`: rascunho, validação das regras acima, numeração.
- `cli.mjs`: `folego`, `novo`, `checar`. Testes em `ficha.test.mjs`.
- Fichas: `media/show-da-semana/fichas/<id>.json` (texto com fonte, vai pro git; imagens não).
