// Filtros de relevancia.
// REL_RX: regex que casa nomes/termos PJ. Usado pra feeds nao-dedicados (Pitchfork, Rolling Stone, mídia BR).
// canonicalize: normaliza URL pra dedupe (remove utm_*, ref, fragment, m. → www.).
// sha10: hash curto pra usar como id estavel.

import crypto from "node:crypto";

export const REL_RX = /\b(pearl[\s-]?jam|eddie\s+vedder|mike\s+mccready|stone\s+gossard|jeff\s+ament|matt\s+cameron|ten[\s-]?club|dark\s+matter|gigaton|lightning\s+bolt|backspacer|riot\s+act|vitalogy|binaural|yield|no[\s-]?code|mookie\s+blaylock|mother\s+love\s+bone)\b/i;

export function isRelevant(text) {
  return REL_RX.test(text || "");
}

export function canonicalize(rawUrl) {
  try {
    const u = new URL(rawUrl);
    // remove tracking params
    [...u.searchParams.keys()]
      .filter((k) => /^(utm_|fbclid|gclid|ref|mc_|_hsenc|_hsmi|mkt_)/i.test(k) || k === "ref" || k === "source")
      .forEach((k) => u.searchParams.delete(k));
    // remove fragmento
    u.hash = "";
    // normaliza host
    u.host = u.host.replace(/^m\./, "www.");
    // trailing slash
    let s = u.toString();
    if (s.endsWith("/")) s = s.slice(0, -1);
    return s;
  } catch {
    return rawUrl;
  }
}

export function sha10(input) {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 10);
}

// Filtro Reddit (score + flair)
export function passesRedditFilter(post, filter) {
  if (!post) return false;
  if ((post.score || 0) < filter.minScore) return false;
  const flair = post.link_flair_text || "";
  if (!filter.allowedFlairs.some((f) => flair.toLowerCase().includes(f.toLowerCase()))) return false;
  // ainda assim, exige relevancia PJ no titulo
  return isRelevant(post.title);
}
