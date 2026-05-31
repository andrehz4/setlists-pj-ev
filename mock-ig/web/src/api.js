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

export async function resetStore() {
  await fetch("/_mock/reset", { method: "POST" });
}

// Polling simples: chama fn a cada ms, retorna funcao de cleanup.
export function poll(fn, ms = 3000) {
  fn();
  const id = setInterval(fn, ms);
  return () => clearInterval(id);
}
