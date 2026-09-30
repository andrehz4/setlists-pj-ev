# Voz humana em PT-BR (humanizer das notícias)

Versão enxuta da skill `humanizer-ptbr` do Andre, adaptada pra notícia de fã. Vale pra TODO texto curado
(mídia, digest, spotlight): título, título do card, intro e corpo. Não muda fato nenhum: só tira a cara de IA.
Onde este guia e o prompt do tipo de item divergirem, o prompt do tipo vence (menos no travessão, sempre proibido).

## 1. Português do Brasil, com acento

- Acento e cedilha SEMPRE: turnê, álbum, não, já, até, música, história, mistério, próximo, último, São Paulo.
  Texto sem acento é recusado pela trava automática e volta pra fila. Escreva o JSON em UTF-8 normal,
  nunca "achate" o texto pra ASCII.
- Português do Brasil, não de Portugal: "o Pearl Jam" (nunca "os Pearl Jam"), "a banda está tocando"
  (nunca "está a tocar"), "equipe" (não "equipa"). Fontes italianas e portuguesas puxam pra isso: cuidado.
- Sem inglês solto. Traduza o jargão: "sitting in" = "participação" ou "músico convidado", "headline" =
  "atração principal", "frontman" = "vocalista" ou o nome. Fica em inglês só nome próprio: música, disco,
  festival, programa, empresa ("Better Man", "Dark Matter", "Ohana Festival").
- Crase e preposição no lugar: "à beira do Pacífico", "disse à Rolling Stone", "pro fim de semana"
  (não "pra o").

## 2. Vocabulário de IA (cortar ou trocar pela coisa concreta)

mergulhar, jornada (metafórica), cenário (abstrato), legado, testemunho, marco, icônico, emblemático,
marcante, crucial, fundamental, essencial, notável, inegável, desvendar, divisor de águas, ponto de virada.
Um "icônico" solto passa; dois desses no mesmo texto já é tique. Trocar "crucial" por "fundamental" não resolve.

## 3. Enchimento (cortar a moldura, manter a informação)

vale destacar, vale ressaltar, é importante salientar, nesse sentido, nesse contexto, dessa forma, no cenário
atual, cada vez mais, devido ao fato de (= porque), com o objetivo de (= para), em suma, dito isso, vamos ao que
interessa. "Além disso" abrindo parágrafo sem somar nada também é enchimento.

## 4. Estruturas de IA

- "Não é só X, é Y", "vai além de", "mais do que isso": diga o fato direto.
- Gancho dramático sem drama real: "e foi aí que tudo mudou", "mas aqui está o que ninguém conta",
  "e isso importa". Entregue o fato.
- Parágrafo de uma linha só pra criar pausa ("E foi isso."): junte ao vizinho. Uma ou duas no texto podem
  ser escolha; uma a cada três parágrafos é tique.
- Rodízio de sinônimos ("Eddie... o vocalista... o cantor... o frontman"): repita o nome, use "ele" ou
  sujeito oculto.
- Fugir de "é/tem/foi" ("atua como", "se configura como", "conta com"): use o verbo simples.
- Title Case em título ("Pearl Jam Anuncia Turnê"): só a primeira palavra e nomes próprios em maiúscula.

## 5. Não mexer (falso positivo)

- Fala entre aspas é do entrevistado: não se humaniza. Se ele disse "legado", fica "legado".
- Nome de música, disco, programa e empresa fica como é.
- Gíria de fã (setlist, bootleg, riff, show, cover) é o jeito que o público fala: fica.
- Detalhe específico (número, data, lugar, apelido) é o que faz o texto parecer de gente. Nunca apague.

## 6. Checagem final (10 segundos por item, antes de gravar o JSON)

1. Tem acento em tudo? (turnê, álbum, não, já)
2. Tem travessão? Tem inglês solto fora de nome próprio? Tem "os Pearl Jam"?
3. As datas batem com o dia da semana e com o que já foi publicado? (ver seção de contexto do routine-prompt)
4. Afirmei "confirma", "oficializa" ou "anuncia" sem declaração oficial da banda ou do integrante na fonte?
5. Acrescentei ou perdi algum fato, nome, número, data ou citação? Se sim, é erro: volte ao original.

Créditos: base na skill `humanizer-ptbr` (/Users/andrehz/.claude/skills/humanizer-ptbr), que por sua vez
parte de blader/humanizer (MIT) e das versões PT-BR de mackswendhell e opaulomarcondes (MIT).
