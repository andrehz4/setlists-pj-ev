# Trilhas do reel e do story

**Desde 13/11/2026 a trilha principal é a PRÓPRIA** (Suno Premier, 9 camas com instrumentos separados, mixadas no
tempo de cada vídeo): `scripts/publish/trilha/` (README lá), ligada pela flag `TRILHA_PROPRIA=1` no reel, no story
diário e no story da agenda. Licença Suno Premier: uso comercial, faixa baixada na vigência segue liberada, sem crédito
obrigatório. Áudio no R2 (`trilha/<cama>/<instrumento>.m4a`), kit em `scripts/publish/trilha/kit-publicado.json`.

As faixas desta pasta ficam só como **RESERVA**: entram (rodízio diário, `story-track.mjs`, dia do ano % quantidade)
quando a flag está desligada ou quando a trilha própria falha (kit ausente, R2 fora do ar).
As 2 faixas do Suno grátis (06 e 07, uso não comercial) saíram em 13/11/2026.

Só música royalty-free ou gerada por nós. NUNCA música do Pearl Jam (direito autoral; o IG detecta pelo áudio).
Preferir faixa SEM registro no Content ID (o Pixabay mostra um escudo na lista quando a faixa está registrada).
O volume é ajustado na mixagem (loudnorm -16 LUFS), não precisa normalizar o arquivo. Salvar em MP3 160 kbps.

| Arquivo | Origem | Licença |
|---|---|---|
| 01 a 05 | Pixabay Music | Licença Pixabay (uso livre, sem crédito obrigatório) |
| 08-pixabay-rust-and-rain | Pixabay, "Rust and Rain (Grunge Rock 102 BPM)" | Licença Pixabay, sem Content ID |
| 09-pixabay-abydos-90s-garage-rock | Pixabay, Abydos_Music, "90s Garage Rock" | Licença Pixabay, sem Content ID |
| 10-pixabay-nickpanek-get-in-the-groove | Pixabay, Nicholas Panek, "Get in the Groove" | Licença Pixabay, sem Content ID |
| 11-pixabay-331music-grunge-punk | Pixabay, 331music, "Grunge Punk" | Licença Pixabay, sem Content ID |
| 12-pixabay-yutanaya-when-youre-not-here | Pixabay, Yutanaya, "When You're Not Here" | Licença Pixabay, sem Content ID |
| 13-pixabay-mlvr-fluid | Pixabay, Mlvr, "f l u i d" (post-rock) | Licença Pixabay, sem Content ID |
| 14-pixabay-nickpanek-energetic-pop-punk-grunge | Pixabay, Nicholas Panek, "Energetic Pop Punk Grunge" | Licença Pixabay, sem Content ID |
| 15-pixabay-hercules-rock-para-podcast | Pixabay, herculesHVNprojetos, "Rock para podcast" | Licença Pixabay, sem Content ID |
| 16-pixabay-robert-anthony-6-am-rock | Pixabay, Robert_Anthony_Art, "6 AM Rock" (indie grunge) | Licença Pixabay, sem Content ID |

**Decisão do Andre (2026-10-01): nenhuma trilha leva crédito na legenda** (nem a própria, nem Pixabay). Não adicionar
"trilha: ..." em reel nem story.
