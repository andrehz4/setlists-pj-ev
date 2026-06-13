# Acervo de clipes pro reel semanal

Trechos curtos de clipes que servem de fundo nos blocos de "tipografia cinética" e no cold open do reel. Sempre entram MUDOS na peça (a trilha royalty-free cobre o áudio).

## Como adicionar um trecho

1. Corte o trecho: MP4 H.264, 1080p ou mais, **2 a 6 segundos**, sujeito centralizado (o crop pra 9:16 come as laterais de vídeo horizontal).
2. Salve nesta pasta com nome descritivo, ex: `alive-solo-mike.mp4`.
3. Adicione a entrada no `clips.json`:

```json
{
  "file": "alive-solo-mike.mp4",
  "song": "Alive",
  "era": "1991",
  "tags": ["mike", "memoria"],
  "mood": "energia"
}
```

- `tags`: usa as mesmas tags das notícias (eddie, mike, jeff, stone, matt, turne, lancamento, memoria, comunidade...). O seletor casa clipe com notícia por interseção de tags.
- `mood`: livre (energia, contemplativo, aovivo), hoje só documental.

## Comportamento sem acervo

Sem clipe disponível (pasta vazia ou nenhuma tag casando), o pipeline degrada sozinho: bloco cinético usa a foto da notícia com zoom lento, e item sem foto usa o fundo escuro com "CLIPE" fantasma (o mesmo do protótipo aprovado). Ou seja, o reel sai toda semana mesmo com acervo vazio, e melhora conforme você adiciona trechos.
