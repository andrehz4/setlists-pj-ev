# Playbook: gerar e editar imagens com Google Flow / Nano Banana

O Andre tem assinatura paga do **Google Flow** e do **Nano Banana** (gerador e editor de imagem do Google, dentro do
Gemini). Usamos do mesmo jeito que o Claude Design: pelo navegador, com o Andre logado, eu preparo referência e pedido,
ele (ou eu, com ele vendo) gera, baixa, e eu trato o arquivo pro destino. Registrado em 2026-09-30.

## Quando usar

- Marca e identidade: selo, foto de perfil, capa de rede social, variações do selo (cor, fundo, formato).
- Recuperar arte em alta resolução quando só existe versão pequena ou com marca d'água (ex: o selo só existia num GIF
  270x480 com "Veo" no canto; o Nano Banana tinha o original em 2816x1536).
- Ilustração de apoio (fundo, textura, mockup). NÃO usar pra inventar foto de pessoa real, show ou integrante: foto de
  banda vem de fonte real (media/band/, Commons), nunca gerada.

Pra layout e tipografia de peça que vira código (slides, reel, story), o caminho continua sendo o **Claude Design**
(ver `design-handoff/`, memória `claude-design-handoff-html`). Nano Banana é pra imagem, não pra layout.

## Passo a passo

1. **Referência**: separo a imagem de base e salvo numa pasta da Mesa (`/Users/andrehz/Desktop/<assunto>/`), pra ele
   anexar. Arquivos pra upload pelo Chrome (extensão) precisam estar no scratchpad da sessão, não na Mesa.
2. **Pedido**: escrevo o prompt completo em PT, descrevendo o que manter fielmente (texto exato, cores, elementos) e o
   formato de saída (tamanho, fundo, sem marca d'água, sem texto extra). Texto em arco é onde a IA mais erra: sempre
   listar o texto literal de cada anel.
3. **Gerar**: no navegador (gemini.google.com ou labs.google/flow), com a conta do Andre. Login é sempre ele.
4. **Baixar**: o arquivo cai em `/Users/andrehz/Downloads/` (`Gemini_Generated_Image_*.jpg`). Procuro por data.
5. **Conferir antes de usar**: abro a imagem e leio letra por letra o texto gerado (acento, "Ã", "PJ & EV").
6. **Tratar**: recorte e redimensionamento com `sharp` (node do projeto), sempre gerando prévia (ex: recorte redondo pra
   foto de perfil) e abrindo pro Andre ver.
7. **Guardar**: versão original + versões finais em `media/marca/` (versionado), com o tamanho no nome.

## Acervo de marca (`media/marca/`)

| Arquivo | O que é |
|---|---|
| `selo-original-2816x1536.jpg` | selo "Só Mais um Fã de Pearl Jam · Independente · Não oficial" em alta, gerado no Nano Banana |
| `perfil-quadrado-1000.jpg` | selo recortado em quadrado com margem (cabe no círculo de foto de perfil) |
| `capa-x-1500x500.jpg` | capa do X no estilo bilhete do site (feita em SVG + sharp, fontes do projeto) |

Recorte usado no perfil: `extract({ left: 640, top: 0, width: 1536, height: 1536 })` do original, depois 1000x1000.

## Pedido modelo (selo)

> Recrie este selo circular em alta resolução (2048x2048), visto exatamente de frente, sem inclinação. Mantenha fielmente
> todo o texto: "SÓ MAIS UM FÃ DE PEARL JAM" (anel de cima), "SETLISTS & SHOW ARQUIVO · PJ & EV" (anel interno),
> "INDEPENDENTE · NÃO OFICIAL" (embaixo), a figura central de braços abertos com o coração, ondas, montanhas, rosa dos
> ventos N/S/E/W e notas musicais. Mesmas cores (creme, azul acinzentado, verde, laranja). Fundo liso claro, selo
> centralizado ocupando ~90%. Sem marca d'água, sem texto extra.
