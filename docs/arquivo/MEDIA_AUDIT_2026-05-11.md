# Auditoria de Mídia 2 — Achados via Drive (passada 2)
**Data:** 2026-05-11
**Escopo:** Continuação do MEDIA_AUDIT_2026-04-29. Re-busca no Google Drive (`eng.andrehz@gmail.com`) com queries mais agressivas, foco nos shows Brasil 2015 e Chicago 2024.

> ⚠️ **STATUS APÓS REVISÃO:** O lote de 56 my_photos importadas em massa foi REVERTIDO (commit subsequente ao `e1d5d0a` removeu os arquivos das 5 pastas `mine/`). Motivo: o filtro automático por tamanho (>80KB) deixou passar conteúdo inadequado (chat screenshots privados, prints pessoais reenviados via WhatsApp). Próxima abordagem: importar **show por show** com revisão visual prévia antes de qualquer commit. As listas de file_ids do Drive abaixo continuam válidas como candidatos para essa retomada manual.
> O vídeo `ev-2014-05-06/videos/video-1.mp4` permanece em disco.

---

## 1. Resumo do que mudou em disco

| Item | Antes | Depois |
|---|---|---|
| `pj-2015-11-11/mine/` | vazia (0/2 slots) | 2 fotos + 2 thumbs ✓ |
| `pj-2015-11-14/mine/` | vazia (0/15 slots) | 15 fotos + 15 thumbs ✓ |
| `pj-2015-11-17/mine/` | vazia (0/7 slots) | 7 fotos + 7 thumbs ✓ |
| `pj-2015-11-20/mine/` | vazia (0/2 slots) | 2 fotos + 2 thumbs ✓ |
| `pj-2015-11-22/mine/` | vazia (0/30 slots) | 30 fotos + 30 thumbs ✓ |
| `ev-2014-05-06/videos/` | pasta vazia (`.gitkeep`) | `video-1.mp4` 1.47 MB ✓ |

**Total importado:** 56 my_photos + 56 thumbs + 1 vídeo = **113 arquivos novos**.

**Cobertura de gaps Brasil 2015:** **100%** dos slots my_photos declarados no manifest agora têm conteúdo em disco.

---

## 2. Chicago 2024 — vídeos confirmados sem gap novo

Re-busca por `parentId in ['1ip1Re6QwQ_D4atWPDFOidnVGX20rZEgE', '1_JuyO_3xIpwqhRsGLygDuBBj0XbbdAr5']` (pastas "29/08/2024" e "31/08/2024" no Drive).

- `29/08/2024/`: 6 vídeos VID_20260421_135833 a 135856.mp4 → batem 1:1 com `pj-2024-08-29/videos/video-1.mp4` a `video-6.mp4` já em disco.
- `31/08/2024/`: 13 vídeos VID_20260421_140113 a 140220.mp4 → batem 1:1 com `pj-2024-08-31/videos/video-1.mp4` a `video-13.mp4` já em disco.

**Conclusão:** o audit de 04-29 estava correto, vídeos de Chicago não tinham gap. Andre perguntou pra confirmar e a confirmação é zero arquivo novo de Chicago.

---

## 3. Brasil 2015 — fonte canônica das fotos importadas

Pasta 1 (id `1UZ_iZuh7dnHaF9YT3humk54xKIx2004g`) e pasta 2 (id `1f_y9ppRDVYN8yb3y79EZ9CWQFZ6NjVHz` = "Sent" filha da 1). Conjunto bruto de fotos WhatsApp entre 08/11/2015 e 29/02/2016, ~250+ arquivos. Audit anterior só pegou ~8 dessa pasta, este audit consolidou todos.

### Critério de curadoria aplicado

1. Filtrar candidatas por data (data do show ± 2 dias adjacentes).
2. Descartar arquivos `< 80 KB` (predominam chat screenshots, memes, conversas).
3. Ordenar por tamanho descendente (proxy razoável de "foto real de alta resolução").
4. Pegar exatamente N picks por show, N = `my_photos` declarado no manifest.
5. Renomear pro slot esperado pelo código: `mine/photo-K.jpg` para K=1..N.
6. Gerar thumb 320px wide com qualidade 5 (`mine/photo-K-thumb.jpg`).

### Picks por show

#### pj-2015-11-11 Belo Horizonte (2 slots)
| Slot | Origem Drive | Tamanho |
|---|---|---|
| photo-1 | `1Et41z9...` IMG-20151111-WA0002 | 128 KB |
| photo-2 | `1i4Shxk...` IMG-20151111-WA0003 | 162 KB |

#### pj-2015-11-14 SP (15 slots)
14 fotos do dia 14/11 (WA0017, WA0007, WA0002, WA0004, WA0013, WA0027, WA0012, WA0010, WA0025, WA0043, WA0045, WA0046, WA0011, WA0031) + 1 do dia 13/11 (WA0035, 462 KB).

#### pj-2015-11-17 Brasília (7 slots)
Todas do dia 17/11: WA0004 (1.6 MB jpeg), WA0058, WA0050, WA0023, WA0054, WA0046, WA0032.

#### pj-2015-11-20 Rio dia 1 (2 slots)
Ambas do dia 20/11: WA0017 (146 KB), WA0015 (128 KB).

#### pj-2015-11-22 Rio dia 2 (30 slots)
Combinação de 3 datas:
- 21/11 (Sent + main): 12 picks
- 22/11 (Sent + main): 5 picks
- 23/11 (Sent): 13 picks após substituição de 4 duplicatas

##### Duplicatas detectadas e substituídas

O Drive trata como arquivos distintos fotos que foram reenviadas por contatos diferentes no WhatsApp. Após primeiro download, MD5 detectou 4 redundâncias no show 22/11:
- `WA0072 (slot 5) == WA0094 (slot 4)` → slot 5 substituído por `WA0011` (23/11, 207 KB, id `1PSN2xi...`)
- `WA0046 (slot 9) == WA0033 (slot 8)` → slot 9 substituído por `WA0093` (23/11, 266 KB, id `1Cidy28...`)
- `WA0027 (slot 10) == WA0033 (slot 8)` → slot 10 substituído por `WA0092` (23/11, 236 KB, id `1q36zfl...`)
- `WA0086 (slot 23) == WA0047 (slot 7)` → slot 23 substituído por `WA0069` (23/11, 201 KB, id `1GIoXNp...`)

Validação final: `md5sum photo-1..30.jpg | sort -u | wc -l` → **30 unique** ✓

---

## 4. ev-2014-05-06 — vídeo importado

| Slot | Origem Drive | Tamanho | Metadata |
|---|---|---|---|
| `videos/video-1.mp4` | `1FB5VD7-kzSlKrQIsDk5I1t9LY-yy5EHj` (pasta "Teste") | 1.47 MB | 400x400 H264 + AAC, 11.3s |

O nome do arquivo no Drive era `10284161_825059930855956_1555696798_n~2.mp4` (padrão Facebook). Aspecto 400x400 e duração curta confirmam clipe de rede social da época. Bate com a declaração de 1 vídeo no manifest do show.

⚠️ **Validação visual pendente:** não foi possível confirmar que é fato deste show (Citibank Hall SP, 06/05/2014) sem assistir. Andre deve confirmar visualmente quando abrir o show no site.

---

## 5. ev-2014-05-06 — my_photos ainda em aberto

`media/ev-2014-05-06/mine/` permanece vazia (4 my_photos declaradas no manifest, 0 em disco). Não houve achado claro de fotos com data 06/05/2014 ou 07/05/2014 no Drive na busca atual. Fica como gap pendente.

---

## 6. Comunidade — gap externo confirmado

O código (`index.html:6234-6253`, `COMUNIDADE_PHOTOS = 22`) espera `media/comunidade/photo-1.jpg` a `photo-22.jpg` + thumbs (44 arquivos). **Pasta `media/comunidade/` não existe.** Chip "🤘 Comunidade" da galeria filtrada por 2015 está quebrada.

Buscas no Drive não acharam material com nome de comunidade/fans. Algumas fotos importadas em `mine/` (em particular as do dia 17/11 com snippets de Instagram do `@present_tensepj`) sugerem que a fonte canônica das 22 Comunidade são posts de fãs do PJ Brasil em redes sociais. **Fica como gap externo a coletar separadamente.**

---

## 7. Outros gaps do audit anterior — sem progresso

| Show | Gap | Status nesta passada |
|---|---|---|
| pj-2011-11-03, 04, 06, 09 | my_photos 1, 3, 1, 4 | Sem achado no Drive |
| pj-2013-03-31, 04-03, 04-06 | my_photos 5, 2, 4 | Sem achado no Drive |
| pj-2018-03-21 | my_photos 5 (4 já achadas, 1 falta) | Sem novo achado |
| pj-2024-08-31 | poster-1.jpg | Sem achado no Drive |
| pj-2005-12-02 | audio/ 26 MP3s | Sem achado no Drive |
| ev-2014-05-07 a 12 | photos + my_photos vários | Sem achado novo |
| ev-2018-03-28, 29, 30 | photos + my_photos vários | Sem achado novo |

Esses ficam como gaps internos a fechar em sessão futura, possivelmente com novas fontes externas.

---

## 8. Resumo geral

| Métrica | Valor |
|---|---|
| Arquivos baixados nesta passada | **113** (56 jpgs + 56 thumbs + 1 mp4) |
| Bytes baixados (jpgs originais) | ~15 MB |
| Bytes baixados (vídeo) | 1.47 MB |
| Gaps fechados | 5 shows Brasil 2015 (my_photos 100%) + 1 vídeo ev-2014-05-06 |
| Gaps confirmados sem fonte | Comunidade (22 fotos), 14 shows com my_photos zero, pj-2005-12-02 áudio |

---

*Relatório gerado em 2026-05-11.*
