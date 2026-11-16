# Estudo da carreira do Eddie Vedder (setlist.fm)

Pasta: `/Users/andrehz/Documents/Githubhz/setlists-pj-ev/reels-especiais/eddie-carreira`

## Como rodar de novo
- Atualizar os dados (precisa da chave): `SETLISTFM_API_KEY=... node coletar.mjs bruto` (pula página já salva).
- Gerar o estudo (sem rede): `node agregar.mjs`. Lê `bruto/`, escreve `estudo.json` (870 KB, ler em recortes com `jq`).
  `agregar-lib.mjs` faz a leitura e a contagem. Chaves: `solo`, `pearl_jam`, `somados`, `cruzamento`, `brasil`.

## Pedidos à API
- Este agente fez 0 pedidos. Só leu `bruto/`: 16 páginas do Eddie (318 setlists) e 57 do Pearl Jam (1135).
- A rodada de hoje do `coletar.mjs` fez 3 pedidos (log), porque as páginas já estavam salvas. A coleta original
  deve ter feito perto de 75 (73 páginas mais 2 buscas de artista). Esse número é estimativa, não está no log.

## Regras de contagem
- 1 contagem por show. Fita de abertura (`tape`) fora. Nomes unidos sem diferenciar maiúscula, acento e pontuação.
- Cover = música creditada a outro artista que não Pearl Jam nem Eddie Vedder.
- Eras solo: acrescentei "antes de 2008" (46 shows) às três pedidas, para não perder 1992 a 2007.

## O que ficou de fora e por quê
- 36 setlists vazios: 3 do Eddie e 33 do Pearl Jam (a página existe no setlist.fm, sem música lançada).
- Setlist novo depois da coleta: o coletor pula página já salva, então `bruto/` não se atualiza sozinho.
- "Solo" é o que o setlist.fm lista no nome Eddie Vedder: inclui participações e festivais curtos, o que puxa a
  média de músicas por show para baixo (17,6). Não separei show inteiro de participação.
- Trechos e medleys contam como o setlist.fm registrou. Nomes alternativos da mesma música não foram unidos.
- `somados` conta duas vezes a noite em que os dois artistas têm setlist no mesmo dia.
- Tipo de local (aberto ou fechado) não existe no dado. "Primeira vez ao ar livre" precisa de conferência.
