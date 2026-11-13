# Trilha própria (Suno Premier, instrumentos separados)

Substitui as trilhas grátis de `scripts/publish/assets/story-tracks/` no reel, no story diário e no story da agenda.
As faixas nascem no trilha-hz (`/Users/andrehz/Documents/Githubhz/trilha-hz/scripts/pearl-jam/`): raio-x de 12 músicas
do Pearl Jam, pedidos ao Suno sem nome de banda, juiz pela régua do PJ e ACRCloud (nenhuma reconhecida como PJ).
O trilha-hz entrega `/Volumes/SSD Terra Gentil/trilha-hz/pearl-jam/entrega-setlists.json`; daqui só se lê.

| Arquivo | Papel |
|---|---|
| `kit.mjs` | Lê a entrega, níveis por família (magro, médio, cheio), candidatos de início na faixa. |
| `plano.mjs` | Plano de níveis no tempo do reel e do story (golpe = banda inteira entrando na manchete). |
| `mixar.mjs` | Envelope de volume por família no ffmpeg, escolha do instrumento calmo, ganho fixo em -16 LUFS, troca de áudio. |
| `testar-reel.mjs` | Teste num reel JÁ RENDERIZADO: troca só o áudio, uma versão por cama. Não publica. |
| `r2.mjs` | `subir` (Mac com SSD): converte as pistas em AAC 256k, sobe pro R2 (`trilha/<cama>/<instrumento>.m4a`) e grava o `kit-publicado.json`. `conferir`: o que não responde no R2. No publish, baixa só a cama do dia. |
| `ligar.mjs` | Porta de entrada do publish: `trilhaPropria({ uso, semente, plano, duracao, saida })`. Devolve a trilha mixada ou null (flag desligada, sem kit, R2 fora): aí segue a trilha antiga. |
| `kit-publicado.json` | A entrega do trilha-hz sem caminho do SSD (só camas aprovadas no ACRCloud). Versionado. |

Teste: `node scripts/publish/trilha/testar-reel.mjs <reel.mp4> <pasta> [hz-pj-03b ...]`.

Regras aprendidas (13/11/2026):
- Nada de `loudnorm` direto no áudio curto: no modo padrão ele comprime e apaga o golpe. Ganho medido + limitador.
- O calmo usa UMA família melódica que toca de verdade nos trechos calmos (piano primeiro). Sem essa checagem a
  abertura saía muda em 2 de 9 camas.

LIGADO desde 13/11/2026 (flag `TRILHA_PROPRIA=1` em publish-reel, publish-story e agenda-story):
- Reel: cama por rodízio da semana ISO (as 9), plano `planoReel` no tempo REAL das cenas (com narração cada cena dura a
  fala). Por baixo da voz: ganho fixo até -24 LUFS + o sidechain que já existia (sem loudnorm na música).
- Story diário: camas 03 e 04, golpe em cada troca de manchete (`planoStory`).
- Story da agenda: camas 04 e 03b, golpe em logo, mapa, shows e final; volume 0.25 (as antigas, mais altas, usam 0.16).
- `reel-video` e `story-video` pulam o loudnorm quando a trilha é própria (`audioPronto`).
- Faixa nova no trilha-hz: atualizar a entrega lá e rodar `node scripts/publish/trilha/r2.mjs subir` aqui.
