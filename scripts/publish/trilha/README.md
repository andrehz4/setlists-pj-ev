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

Teste: `node scripts/publish/trilha/testar-reel.mjs <reel.mp4> <pasta> [hz-pj-03b ...]`.

Regras aprendidas (13/11/2026):
- Nada de `loudnorm` direto no áudio curto: no modo padrão ele comprime e apaga o golpe. Ganho medido + limitador.
- O calmo usa UMA família melódica que toca de verdade nos trechos calmos (piano primeiro). Sem essa checagem a
  abertura saía muda em 2 de 9 camas.

AINDA NÃO LIGADO no publish (flag `TRILHA_PROPRIA` a criar). Antes de ligar: cópia do áudio no R2 (o Actions não vê o
SSD), escolha de cama por clima da semana e mixagem sob a narração do reel (ElevenLabs).
