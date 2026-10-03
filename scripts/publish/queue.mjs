// Fila de publicacao no Instagram. Cada item curado pelo Sonnet entra
// aqui com publishAt = now (sem delay editorial). Decisao: Andre confia
// 100% na curadoria/traducao da routine Sonnet e nao revisa antes de
// postar; manter delay so cria janelas mortas no feed (ver memoria
// feedback_no_publish_delay.md). O worker do cron (30min) le items
// maduros, agrupa por type (regular vs spotlight), monta carrossel
// e marca como postado.

// Fachada: o código vive em scripts/publish/fila/ (io, denylist, cooldown, selecao, marcacao).
// NUNCA mexer na fila sem entender markPosted/mergeQueueStates (repost no feed).
export * from "./fila/io.mjs";
export * from "./fila/denylist.mjs";
export * from "./fila/cooldown.mjs";
export * from "./fila/selecao.mjs";
export * from "./fila/marcacao.mjs";
