# Auditoria de Mídia — Catálogo Pearl Jam + Eddie Vedder
**Data:** 2026-04-29  
**Escopo:** Manifest `media-manifest.json` vs. arquivos em `media/`; busca de gaps no Google Drive.

---

## 1. Tabela "Gaps no Manifest"

> Legenda de colunas: **Esperado** = o que o manifest declara; **Encontrado** = o que existe em disco; **Gap** = diferença.

### Convenção de contagem
- `poster: true` → 1 arquivo `poster.jpg`
- `posters: N` → arquivos `poster-1.jpg` … `poster-N.jpg`
- `photos: N` → `photo-1.jpg` … `photo-N.jpg` + thumbs (N×2 arquivos); **os arquivos de foto oficial já existem** para todos os shows que os declaram
- `my_photos: N` → `mine/photo-1.jpg` … `mine/photo-N.jpg` + thumbs (N×2 arquivos), numa subpasta `mine/`
- `videos: [...]` → arquivos mp4 em `videos/`
- `audio: [...]` → arquivos mp3 em `audio/`

### Resultado da inspeção de disco

| Show ID | Tipo faltante | Qtde arquivos faltantes | Detalhes |
|---|---|---|---|
| **pj-2011-11-09** | my_photos (mine/) | 8 | 4 fotos + 4 thumbs esperadas em `mine/`; pasta inexistente |
| **pj-2013-04-03** | my_photos (mine/) | 4 | 2 fotos + 2 thumbs; pasta inexistente |
| **pj-2013-04-06** | my_photos (mine/) | 8 | 4 fotos + 4 thumbs; pasta inexistente |
| **pj-2011-11-03** | my_photos (mine/) | 6 | 3 fotos + 3 thumbs; pasta inexistente |
| **pj-2011-11-06** | my_photos (mine/) | 2 | 1 foto + 1 thumb; pasta inexistente |
| **pj-2013-03-31** | my_photos (mine/) | 10 | 5 fotos + 5 thumbs; pasta inexistente |
| **pj-2015-11-17** | my_photos (mine/) | 14 | 7 fotos + 7 thumbs; pasta inexistente |
| **pj-2015-11-14** | my_photos (mine/) | 30 | 15 fotos + 15 thumbs; pasta inexistente |
| **pj-2015-11-11** | my_photos (mine/) | 4 | 2 fotos + 2 thumbs; pasta inexistente |
| **pj-2011-11-04** | my_photos (mine/) | 2 | 1 foto + 1 thumb; pasta inexistente |
| **pj-2015-11-20** | my_photos (mine/) | 4 | 2 fotos + 2 thumbs; pasta inexistente |
| **pj-2015-11-22** | my_photos (mine/) | 60 | 30 fotos + 30 thumbs; pasta inexistente |
| **pj-2018-03-21** | my_photos (mine/) | 10 | 5 fotos + 5 thumbs; pasta inexistente |
| **pj-2024-08-29** | my_photos (mine/) | 2 | 1 foto + 1 thumb; pasta inexistente |
| **pj-2024-08-31** | my_photos (mine/) + poster-1.jpg | 3 | 1 foto + 1 thumb em `mine/`; `poster-1.jpg` ausente (manifest: `posters: 2`, mas só `poster-2.jpg` existe) |
| **pj-2005-12-02** | audio/ (26 MP3s) | 26 | Pasta `audio/` inexistente; nenhum dos 26 MP3s encontrado em disco |
| **ev-2014-05-06** | my_photos (mine/) + videos/ | 9 | Pasta `mine/` existe mas está VAZIA (4 fotos + 4 thumbs faltando); pasta `videos/` existe mas está VAZIA (1 vídeo faltando) |
| **ev-2014-05-07** | photos + my_photos (mine/) | 4 | 1 foto + 1 thumb em raiz; 1 foto + 1 thumb em `mine/`; pastas inexistentes |
| **ev-2014-05-08** | photos + my_photos (mine/) | 4 | 1 foto + 1 thumb em raiz; 1 foto + 1 thumb em `mine/`; pastas inexistentes |
| **ev-2014-05-11** | photos + my_photos (mine/) | 8 | 3 fotos + 3 thumbs em raiz; 1 foto + 1 thumb em `mine/`; pastas inexistentes |
| **ev-2014-05-12** | photos + my_photos (mine/) | 8 | 2 fotos + 2 thumbs em raiz; 2 fotos + 2 thumbs em `mine/`; pastas inexistentes |
| **ev-2018-03-28** | photos + my_photos (mine/) | 20 | 9 fotos + 9 thumbs em raiz; 1 foto + 1 thumb em `mine/`; pastas inexistentes |
| **ev-2018-03-29** | photos | 16 | 8 fotos + 8 thumbs em raiz; pasta inexistente (show sem my_photos) |
| **ev-2018-03-30** | photos + my_photos (mine/) | 20 | 9 fotos + 9 thumbs em raiz; 1 foto + 1 thumb em `mine/`; pastas inexistentes |

> **Shows OK (sem gaps):** pj-2005-12-02 *(fotos/poster ok)*, pj-2013-04-03 *(fotos/poster ok — apenas mine/ falta)*, todos os shows têm `poster.jpg` presente. Os vídeos de pj-2024-08-29 e pj-2024-08-31 estão completos (excluídos desta auditoria conforme instrução).

**Total de gaps contabilizados:** ~283 arquivos faltantes (contando fotos + thumbs + áudios + vídeos).

---

## 2. Tabela "Achados no Google Drive"

> Apenas arquivos do owner `eng.andrehz@gmail.com` com potencial de preencher gaps.

### Pasta "rio 18" (id: `1gKGY89gjwRcuBHtRrxHDReQbpqzQmNiM`) → show alvo: pj-2018-03-21

| file_id | Nome | Tamanho | Show alvo | Tipo |
|---|---|---|---|---|
| `1_XDVYP_2FJr4uB688E0x2JwPMXKaXuEc` | `20180321_164041.jpg` | 751 KB | pj-2018-03-21 | foto pessoal |
| `1kV9KbNOJQkC4rmor6rd9EmIFAhaTPrHw` | `20180321_223151.jpg` | 1,1 MB | pj-2018-03-21 | foto pessoal |
| `1nShWjNDHucdXugWEDrXb2r-xDnAxECpV` | `20180321_232731.jpg` | 1,5 MB | pj-2018-03-21 | foto pessoal |
| `1EfHDZzvqFvr6CvbXRurX-AyCX43nPE5W` | `20180321_232756.jpg` | 1,1 MB | pj-2018-03-21 | foto pessoal |

**Total na pasta "rio 18": 4 fotos** — cobre as 5 my_photos declaradas para pj-2018-03-21 (falta 1).

---

### Pasta "sp 18" (id: `1noYaWzjiQ7QOAOEIhAO6sGtncxpeNByB`) → show alvo: AMBÍGUO (pj-2018-03-24 e/ou ev-2018-03-28/29/30)

> ⚠️ **Ambiguidade:** A pasta contém fotos de datas 20180324, 20180328, 20180329 e 20180330. Isso mistura o show PJ SP (24/03) com os 3 shows EV SP (28, 29, 30/03). Não é possível determinar automaticamente se a intenção era separar ou agrupar.

| file_id | Nome | Tamanho | Show alvo provável | Tipo |
|---|---|---|---|---|
| `1AfsZN28awj7XwpfK3tWtVbeXXWpYuenS` | `20180324_164053.jpg` | 587 KB | pj-2018-03-24 | foto pessoal |
| `1v2qtSvQlmgqG5UNcjZiaYF0jWjmJilzi` | `20180328_073819.jpg` | 1,3 MB | ev-2018-03-28 | foto pessoal |
| `1MMi7w5DGsG00mlK4KETxqkzZMZs9NG8u` | `Screenshot_20180329-121938.png` | 1,1 MB | ev-2018-03-29 (?) | foto pessoal (screenshot) |
| `1GKzk3zFCKetiiVhs30NsW4_MrW5K9gi9` | `20180330_200524.jpg` | 1,4 MB | ev-2018-03-30 | foto pessoal |

**Total na pasta "sp 18": 4 arquivos** (3 JPG + 1 PNG/screenshot).

---

### Pasta "Teste" (id: `14jIhGD-PiLcEajn_kxHup3vQpdZi6dQs`) → AMBÍGUO (duplicatas + fotos EV 2014)

> ⚠️ **Ambiguidade:** Esta pasta contém duplicatas dos arquivos de "sp 18" (20180328, 20180329, 20180330) mais fotos EV 2014 (20140513). Parece ter sido usada para teste de upload e pode representar o mesmo conjunto de "sp 18" + EV 2014-05-12.

| file_id | Nome | Tamanho | Show alvo provável | Tipo |
|---|---|---|---|---|
| `1LEgQ5_PVzPvuYRhlek1c3NxWkq9HB-Gl` | `IMG-20140513-WA0000.jpg` | 123 KB | ev-2014-05-12 (dia seguinte ao último show, 12/05) | foto pessoal (WhatsApp) |
| `1CDYX9iqC0dG3DLhNyIK95pp7zerw7pTn` | `IMG-20140513-WA0001.jpg` | 96 KB | ev-2014-05-12 (dia seguinte ao último show, 12/05) | foto pessoal (WhatsApp) |
| `1QXeSjq90t-l-iBYRU7X4zP2L_JdEOBKi` | `IMG-20140513-WA0003.jpg` | 82 KB | ev-2014-05-12 (dia seguinte ao último show, 12/05) | foto pessoal (WhatsApp) |
| `1DTRspIOL73UpcAH2Fs9Lz0QDT5peUL11` | `20180328_073819.jpg` | 1,3 MB | ev-2018-03-28 | foto pessoal (duplicata de "sp 18") |
| `1FFWQW4DCtMEGGKcuQayc-Kk6KXHyCX33` | `Screenshot_20180329-121938.png` | 1,1 MB | ev-2018-03-29 (?) | foto pessoal (duplicata de "sp 18") |
| `1jZoiQa5VL0Ipdkfltk4wbaE5IIQ8AZxP` | `20180330_200524.jpg` | 1,4 MB | ev-2018-03-30 | foto pessoal (duplicata de "sp 18") |

> As fotos `IMG-20140513-*` são de 13/05/2014, um dia após o último show EV (12/05). Podem ser fotos tiradas na manhã seguinte ou recebidas por WhatsApp; mais provavelmente pertencem ao show **ev-2014-05-12** (my_photos: 2 declaradas) mas a data cria ambiguidade.

---

### Pastas 29/08/2024 e 31/08/2024 (já processadas) — my_photos pendentes

| file_id | Nome | Tamanho | Show alvo | Tipo |
|---|---|---|---|---|
| `1Q9oMvVGlJsJUVN_8WIOqG8npu9TlbegH` | `IMG_20260421_175826_127.jpg` | 240 KB | pj-2024-08-29 | foto pessoal |
| `1C42L5YohQMVrFIHgglt2JWSNRGCN1vH8` | `IMG_20260421_180110_540.jpg` | 264 KB | pj-2024-08-31 | foto pessoal |

> Estes dois arquivos correspondem exatamente às `my_photos: 1` declaradas no manifest para pj-2024-08-29 e pj-2024-08-31, respectivamente.

---

### Resumo de achados por show

| Show alvo | Arquivos encontrados no Drive | Gap declarado (my_photos) | Cobertura |
|---|---|---|---|
| pj-2018-03-21 | 4 fotos (pasta "rio 18") | 5 | 80% |
| pj-2018-03-24 | 1 foto (pasta "sp 18") | não tem my_photos no manifest | N/A — arquivo extra |
| ev-2018-03-28 | 1 foto (pasta "sp 18") | 1 my_photo | 100% |
| ev-2018-03-29 | 1 screenshot (pasta "sp 18") | 0 my_photos | N/A — arquivo extra |
| ev-2018-03-30 | 1 foto (pasta "sp 18") | 1 my_photo | 100% |
| ev-2014-05-12 | 3 fotos WA (pasta "Teste") | 2 my_photos | 100%+ (3 encontradas, 2 declaradas) |
| pj-2024-08-29 | 1 foto (pasta "29/08/2024") | 1 my_photo | 100% |
| pj-2024-08-31 | 1 foto (pasta "31/08/2024") | 1 my_photo | 100% |

---

## 3. Resumo Geral

| Métrica | Valor |
|---|---|
| Total de shows no manifest | 24 |
| Shows com algum gap | 23 (todos exceto pj-2024-08-29 e pj-2024-08-31 têm gaps de my_photos) |
| Arquivos faltantes totais (disco) | ~283 (fotos+thumbs+áudios+vídeos) |
| Arquivos relevantes encontrados no Drive | **12 arquivos únicos** (excluindo duplicatas da pasta Teste) |
| Cobertura dos gaps pelo Drive | ~4% (12 de ~283 arquivos ausentes) |

**Categoria com maior impacto:** my_photos estão ausentes em praticamente todos os shows — 22 shows precisam de subpasta `mine/` criada e populada.

**Segundo maior gap:** os 26 MP3s de `pj-2005-12-02` — nenhum encontrado no Drive do usuário.

---

## 4. Não Encontrados (após busca exaustiva no Drive)

### 4.1 Fotos pessoais (my_photos) — shows sem nenhuma correspondência no Drive

| Show ID | my_photos declaradas | Status |
|---|---|---|
| pj-2011-11-09 | 4 | Não encontradas no Drive |
| pj-2013-04-03 | 2 | Não encontradas no Drive |
| pj-2013-04-06 | 4 | Não encontradas no Drive |
| pj-2011-11-03 | 3 | Não encontradas no Drive |
| pj-2011-11-06 | 1 | Não encontrada no Drive |
| pj-2013-03-31 | 5 | Não encontradas no Drive |
| pj-2015-11-17 | 7 | Não encontradas no Drive |
| pj-2015-11-14 | 15 | Não encontradas no Drive |
| pj-2015-11-11 | 2 | Não encontradas no Drive |
| pj-2011-11-04 | 1 | Não encontrada no Drive |
| pj-2015-11-20 | 2 | Não encontradas no Drive |
| pj-2015-11-22 | 30 | Não encontradas no Drive |
| pj-2018-03-21 | 5 | 4 encontradas, **1 faltando** |
| ev-2014-05-06 | 4 | Não encontradas no Drive (pasta `mine/` local existe e está vazia) |
| ev-2014-05-07 | 1 | Não encontrada no Drive |
| ev-2014-05-08 | 1 | Não encontrada no Drive |
| ev-2014-05-11 | 1 | Não encontrada no Drive |

### 4.2 Fotos oficiais (photos) — shows sem fotos em disco

| Show ID | Photos declaradas | Status |
|---|---|---|
| ev-2014-05-07 | 1 | Não encontrada no Drive |
| ev-2014-05-08 | 1 | Não encontrada no Drive |
| ev-2014-05-11 | 3 | Não encontradas no Drive |
| ev-2014-05-12 | 2 | Não encontradas no Drive |
| ev-2018-03-28 | 9 | Não encontradas no Drive |
| ev-2018-03-29 | 8 | Não encontradas no Drive |
| ev-2018-03-30 | 9 | Não encontradas no Drive |

### 4.3 Vídeo pessoal

| Show ID | Arquivo | Status |
|---|---|---|
| ev-2014-05-06 | video-1.mp4 | Pasta `videos/` local existe e está vazia; não encontrado no Drive |

### 4.4 Áudio (CRÍTICO)

| Show ID | Arquivos | Status |
|---|---|---|
| pj-2005-12-02 | 26 MP3s (01 Go.mp3 … 26 Yellow Ledbetter.mp3) | **Nenhum encontrado no Drive do usuário** (`eng.andrehz@gmail.com`). Os únicos MP3s com nomes de músicas PJ encontrados no Drive pertencem ao owner `danieldacg12@gmail.com` (show 14/11/2015, pasta diferente) — não é o show de 2005 e não é dono pelo usuário. |

### 4.5 poster-1.jpg

| Show ID | Arquivo | Status |
|---|---|---|
| pj-2024-08-31 | poster-1.jpg | Ausente em disco; não encontrado no Drive |

---

## 5. Ambiguidades identificadas

1. **Pasta "sp 18"** contém fotos de 4 datas distintas (24/03, 28/03, 29/03, 30/03/2018), misturando o show PJ de SP com os 3 shows EV de SP. Recomenda-se confirmação manual de qual foto pertence a qual show antes de importar.

2. **Pasta "Teste"** é aparentemente uma cópia parcial de "sp 18" com adição das fotos EV 2014. Contém duplicatas exatas (mesmo `fileSize`) dos arquivos de "sp 18". Sugestão: ignorar "Teste" e usar "sp 18" como fonte canônica para os arquivos de 2018.

3. **IMG-20140513-WA*.jpg** (pasta "Teste"): data do arquivo é 13/05/2014, um dia após o último show EV (ev-2014-05-12). Podem ser fotos recebidas por WhatsApp no dia seguinte ao show ou tiradas pela manhã. Classificação sugerida: **ev-2014-05-12 (my_photos)**, mas requer confirmação do usuário.

4. **Screenshot_20180329-121938.png**: é uma captura de tela de 29/03/2018. O show ev-2018-03-29 não declara `my_photos` no manifest (apenas `photos: 8`). Pode ser material extra não mapeado ou evidência de que o manifest está incompleto para esse show.

---

*Relatório gerado em 2026-04-29 por auditoria automatizada.*
