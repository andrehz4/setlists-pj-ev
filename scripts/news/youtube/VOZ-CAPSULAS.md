# Voz das cápsulas

Guia de escrita das cápsulas do YouTube (`media/news/youtube-acervo/_rascunhos.json`). Vale ao escrever uma leva nova e ao revisar uma já escrita. Complementa a régua editorial do `README.md` desta pasta e a skill global `humanizer-ptbr` (`/Users/andrehz/.claude/skills/humanizer-ptbr/SKILL.md`), que por sua vez carrega o humanizer do blader.

Ordem de precedência: régua editorial do README > este guia > humanizer-ptbr > humanizer original. O travessão é proibido em todas.

## Quem escreve

Um fã veterano de Pearl Jam contando para outro fã o que ouviu numa entrevista. Português brasileiro coloquial mas culto, o mesmo registro do curador de notícias (`scripts/news/prompts/system-curator-fa.txt`). Não é portal de notícia, não é roteiro de vídeo curto, não é post de LinkedIn.

## O que já deu certo

As cápsulas das levas 1 a 10 foram aprovadas pelo Andre ("ficou muito bom"). Elas têm, em média, 5 parágrafos, e nenhum parágrafo de uma linha só. A citação entra no meio da prosa, costurada com a narração.

Referência de ritmo: `cap-gn5B6N0` (a morte de Cobain) e `cap-iW5l8QI` (os fãs no Maracanã).

Mesmo nelas há tiques a evitar: "abriu o coração", "vai de um quarto de hotel a uma conversa com o presidente" (falso intervalo), "não foi a distância, foi o que acontecia depois" (não é X, é Y) e o fecho "um momento pequeno, mas que resume...".

## O que desandou

Medição sobre as 345 cápsulas (13/09/2026):

| Levas | Parágrafos por cápsula | Parágrafos de uma linha por cápsula |
|---|---|---|
| 1 a 10 | 5,3 | 0,0 |
| 11 a 30 | 7,9 | 0,2 |
| 31 a 50 | 15,5 | 2,6 |
| 51 a 70 | 17,1 | 4,3 |

O texto foi virando roteiro de vídeo curto: frase solta entre parágrafos para criar suspense ("Era um aspirador de pó.", "Até que foi.", "E aí chegou a manhã de Natal.") e anúncios do que vem ("E ele faz questão de dizer uma coisa.", "A pergunta óbvia veio em seguida, e é a difícil"). É o padrão P6 da humanizer-ptbr.

## Regras

1. **Parágrafo tem pelo menos duas frases.** Exceção: a citação final, ou uma citação curta que precisa respirar sozinha. No máximo uma frase isolada de narração por cápsula, e só se ela trouxer fato novo.
2. **Mire em 5 a 8 parágrafos.** A legenda do Instagram tem 2.200 caracteres com título, intro, assinatura e hashtags. O corpo que passa disso é cortado (`truncar` em `scripts/publish/run-publish-capsula.mjs`).
3. **Não anuncie, conte.** Nada de "e o que ele diz em seguida explica tudo", "há um último ajuste no retrato", "a resposta explica a carreira inteira". Escreva o que ele disse.
4. **Citação é sagrada.** A fala entre aspas não passa pelo humanizer. Se o entrevistado disse "incrível" ou "no fundo", fica. A narração em volta é que se limpa.
5. **Título igual à fala.** O `title_pt` não pode exagerar a citação. Exemplos reais corrigidos: "nunca se sentiu à vontade", quando a fala era "não sei se algum dia me senti"; "coração disparou", quando era "coração despencou".
6. **Título sem gancho encenado.** 137 dos 345 títulos têm duas frases, e 23 abrem a segunda com "E" ("E o plano era continuar assim"). Uma frase só, com o fato mais forte, costuma bastar. Duas frases, só quando a segunda traz fato novo.
7. **Intro sem rajada de fragmentos.** "Selos independentes, rádio universitária, clubes e promotores. Sem nenhuma gravadora grande." vira uma frase normal.
8. **Nome, não sinônimo.** Eddie, Stone, Jeff, Mike, Matt. Nada de "o vocalista", "o guitarrista", "o frontman" para variar.
9. **Nada que não esteja no vídeo.** Não acrescente lugar, data, ano, cenário ou reação que a transcrição não mostre, nem para dar cor.
10. **Carrossel.** As frases dos slides são versões curtas das citações do corpo e mantêm o sentido exato. Mesma regra 4.

## Checklist antes de fechar a leva

- zero `—` e zero `–`
- nenhum parágrafo de narração com uma frase só (ou no máximo um)
- nenhum "não é só", "mais do que isso", "no fundo", "vale lembrar", "e foi aí que" na narração
- título e intro batem com as falas do corpo
- nenhum fato novo em relação à transcrição

## Amostras escolhidas pelo Andre

(a preencher: ids das cápsulas que o Andre considerar referência de voz)
