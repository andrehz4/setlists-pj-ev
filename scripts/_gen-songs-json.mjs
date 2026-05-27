// Gera media/songs.json a partir de ALBUMS, SHOWS (index.html) e media-manifest.json.
// Cada música única vira: { title, album, album_id, year, artist, audio: [{show_id, file, date, venue}] }
// O picker do fórum carrega esse JSON, mostra busca e oferece play quando tem áudio.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function extractJson(src, name, openChar) {
  const closeChar = openChar === '[' ? ']' : '}';
  const re = new RegExp(`const ${name}\\s*=\\s*(\\${openChar}[\\s\\S]*?\\${closeChar});`);
  const m = src.match(re);
  if (!m) throw new Error(`${name} not found`);
  return JSON.parse(m[1]);
}

const ALBUMS = extractJson(indexHtml, 'ALBUMS', '[');
const SHOWS  = extractJson(indexHtml, 'SHOWS', '[');
// O MEDIA_MANIFEST inline do index.html é a fonte canônica (mais completo que media-manifest.json)
const mediaManifest = extractJson(indexHtml, 'MEDIA_MANIFEST', '{');

// Mapa song normalizado -> {title canônica, album, album_id, year, artist}
function norm(s) {
  return (s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function splitMedley(song) {
  // Lógica simples: "A → B" / "A / B" vira ["A","B"]
  return String(song).split(/\s*(?:→|\/|->)\s*/).map(s => s.trim()).filter(Boolean);
}

const songMap = new Map();

// 1. Catálogo dos álbuns (canônico)
for (const album of ALBUMS) {
  for (const songRaw of album.songs) {
    const key = norm(songRaw);
    if (!songMap.has(key)) {
      songMap.set(key, {
        title: songRaw,
        album: album.title,
        album_id: album.id,
        year: album.year,
        artist: album.artist,
        audio: [],
      });
    }
  }
}

// 2. Músicas únicas extras vindas dos SHOWS (covers, raridades)
for (const show of SHOWS) {
  for (const songRaw of (show.songs || [])) {
    for (const part of splitMedley(songRaw)) {
      const key = norm(part);
      if (!key || key.length < 2 || /^\d+$/.test(key)) continue;
      if (!songMap.has(key)) {
        songMap.set(key, {
          title: part,
          album: '',
          album_id: '',
          year: null,
          artist: show.artist,
          audio: [],
        });
      }
    }
  }
}

// 3. Matchar áudios disponíveis (media-manifest tem show_id -> {audio: [filenames]})
function matchAudio(songTitle, audioFiles) {
  const nSong = norm(songTitle);
  for (const f of audioFiles) {
    // remove índice "01 " e extensão ".mp3"
    const fClean = f.replace(/^\d+\s*[-.]?\s*/, '').replace(/\.[^.]+$/, '');
    const nFile = norm(fClean);
    if (!nFile) continue;
    if (nFile === nSong) return f;
    if (nFile.includes(nSong) && nSong.length >= 4) return f;
    // Inverso: arquivo é mais curto que o setlist (medley simples no nome)
    if (nSong.includes(nFile) && nFile.length >= 4) return f;
  }
  return null;
}

for (const [showId, info] of Object.entries(mediaManifest)) {
  if (!info.audio || !info.audio.length) continue;
  const show = SHOWS.find(s => s.id === showId);
  if (!show) continue;
  for (const songRaw of (show.songs || [])) {
    for (const part of splitMedley(songRaw)) {
      const key = norm(part);
      if (!key) continue;
      const entry = songMap.get(key);
      if (!entry) continue;
      const file = matchAudio(part, info.audio);
      if (!file) continue;
      if (entry.audio.some(a => a.show_id === showId && a.file === file)) continue;
      entry.audio.push({
        show_id: showId,
        file,
        date: show.date,
        venue: show.venue + (show.city ? `, ${show.city}` : ''),
      });
    }
  }
}

const songs = [...songMap.values()].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
const withAudio = songs.filter(s => s.audio.length).length;

const out = {
  generated_at: new Date().toISOString(),
  r2_audio_base: 'https://pub-4d99051b225d492fbf4ac3bfdbef7de4.r2.dev',
  total: songs.length,
  with_audio: withAudio,
  songs,
};

const outPath = path.join(ROOT, 'media', 'songs.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
console.log(`songs.json: ${songs.length} músicas (${withAudio} com áudio) → ${outPath}`);

// ============================================================
// SHOWS.JSON: catálogo enxuto pra picker de setlist no fórum
// ============================================================
const showsOut = SHOWS
  .filter(s => !s.extra)
  .sort((a, b) => b.date.localeCompare(a.date))
  .map(s => ({
    id: s.id,
    artist: s.artist,
    date: s.date,
    venue: s.venue,
    city: s.city,
    tour: s.tour || '',
    songs: s.songs || [],
    has_audio: !!(mediaManifest[s.id] && mediaManifest[s.id].audio && mediaManifest[s.id].audio.length),
  }));

const showsOutObj = {
  generated_at: new Date().toISOString(),
  total: showsOut.length,
  with_audio: showsOut.filter(s => s.has_audio).length,
  shows: showsOut,
};
const showsPath = path.join(ROOT, 'media', 'shows.json');
fs.writeFileSync(showsPath, JSON.stringify(showsOutObj, null, 2), 'utf8');
console.log(`shows.json: ${showsOut.length} shows (${showsOutObj.with_audio} com áudio) → ${showsPath}`);
