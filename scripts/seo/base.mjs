// Constantes e utilitários sem dependência, usados por todas as páginas estáticas.
export const SITE_BASE = process.env.SITE_BASE || "https://somaisumfadepearljam.com.br";

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
