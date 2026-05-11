// Smoke test do parser ChordPro: copia as funcoes do index.html aqui
// (duplicacao consciente, scope: test interno) e roda contra .cpro reais.
import fs from 'node:fs';

function _parseChordProLine(line) {
  const tokens = [];
  const re = /\[([^\]]+)\]([^\[]*)|([^\[]+)/g;
  let m;
  while ((m = re.exec(line)) !== null) {
    if (m[1] !== undefined) tokens.push({ chord: m[1], text: m[2] || '' });
    else if (m[3]) tokens.push({ chord: null, text: m[3] });
  }
  return tokens;
}
function _renderChordPro(text) {
  const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const lines = text.split(/\r?\n/);
  const out = [];
  let stanzaLines = [];
  let pendingSectionLabel = null;
  const flushStanza = () => {
    if (!stanzaLines.length) return;
    const lblHtml = pendingSectionLabel
      ? `<div class="cifra-section">${escapeHtml(pendingSectionLabel)}</div>` : '';
    out.push(`<div class="cifra-stanza">${lblHtml}${stanzaLines.join('')}</div>`);
    stanzaLines = [];
    pendingSectionLabel = null;
  };
  for (const raw of lines) {
    const line = raw.replace(/^﻿/, '');
    const directive = line.match(/^\s*\{(?:section|sec|part):\s*([^}]+)\}\s*$/i);
    if (directive) { pendingSectionLabel = directive[1].trim(); continue; }
    if (/^\s*\{.+\}\s*$/.test(line)) continue;
    if (/^\s*#/.test(line)) continue;
    if (!line.trim()) { flushStanza(); continue; }
    const tokens = _parseChordProLine(line);
    const tokHtml = tokens.map(t => {
      const txt = escapeHtml(t.text === '' ? ' ' : t.text);
      if (t.chord) {
        const c = escapeHtml(t.chord);
        return `<span class="cifra-token"><span class="chord-chip" data-chord="${c}" tabindex="0" role="button" aria-label="Acorde ${c}">${c}</span><span class="cifra-syl">${txt}</span></span>`;
      }
      return `<span class="cifra-token"><span class="chord-chip-spacer">&nbsp;</span><span class="cifra-syl">${txt}</span></span>`;
    }).join('');
    stanzaLines.push(`<div class="cifra-line">${tokHtml}</div>`);
  }
  flushStanza();
  return out.join('') || '<div class="tab-pane-soon">cifra vazia</div>';
}

const files = ['black.cpro', 'alive.cpro', 'even-flow.cpro'];
let ok = 0, fail = 0;
for (const f of files) {
  const txt = fs.readFileSync(`media/tabs/cifras/${f}`, 'utf8');
  try {
    const out = _renderChordPro(txt);
    const stanzas = (out.match(/cifra-stanza/g) || []).length;
    const chips = (out.match(/chord-chip"/g) || []).length;
    const sections = (out.match(/cifra-section/g) || []).length;
    const chordSet = [...new Set([...out.matchAll(/data-chord="([^"]+)"/g)].map(m=>m[1]))];
    console.log(`  OK   ${f.padEnd(16)} ${stanzas} estrofes · ${sections} secções · ${chips} chord-chips`);
    console.log(`       acordes únicos: ${chordSet.join(', ')}`);
    ok++;
  } catch (e) {
    console.log(`  FAIL ${f}: ${e.message}`);
    fail++;
  }
}
console.log(`\n${ok} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
