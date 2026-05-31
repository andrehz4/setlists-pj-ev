// Cliente do mock server. Usa caminhos relativos (/_mock/...) que o proxy do
// Vite (dev) ou o proprio mock server (build) resolvem.

export async function fetchFeed() {
  const r = await fetch("/_mock/feed");
  if (!r.ok) throw new Error("feed " + r.status);
  return r.json();
}

export async function fetchStories() {
  const r = await fetch("/_mock/stories");
  if (!r.ok) throw new Error("stories " + r.status);
  return r.json();
}

export async function fetchReels() {
  const r = await fetch("/_mock/reels");
  if (!r.ok) throw new Error("reels " + r.status);
  return r.json();
}

export async function resetStore() {
  await fetch("/_mock/reset", { method: "POST" });
}

export async function fetchControl() {
  const r = await fetch("/_mock/control");
  if (!r.ok) throw new Error("control " + r.status);
  return r.json();
}

// Liga/desliga modo de falha no mock (ratelimit, quota, videoerror) + storyPolls.
export async function setFail(fail, storyPolls = 0) {
  const body = new URLSearchParams({ fail: fail || "none", storyPolls: String(storyPolls) });
  const r = await fetch("/_mock/fail", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  return r.json();
}

// Simulador: material disponivel (read-only) e geracao de previa sob demanda.
export async function fetchCandidates() {
  const r = await fetch("/_mock/candidates");
  if (!r.ok) throw new Error("candidates " + r.status);
  return r.json();
}

export async function requestPreview(id) {
  const body = new URLSearchParams({ id });
  const r = await fetch("/_mock/preview", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || ("preview " + r.status));
  return j;
}

// Polling simples: chama fn a cada ms, retorna funcao de cleanup.
export function poll(fn, ms = 3000) {
  fn();
  const id = setInterval(fn, ms);
  return () => clearInterval(id);
}
