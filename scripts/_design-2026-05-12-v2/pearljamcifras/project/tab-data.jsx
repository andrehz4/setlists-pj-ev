/* eslint-disable */
// Dados da tab de Black — intro/riff principal (4 compassos × 2 linhas)
// Strings ordem visual: e B G D A E (1=aguda no topo)
// "voice" indica qual músico está tocando aquela frase: stone (rhythm), mike (lead), jeff (bass)
// Cada beat = 0.25s no playback simulado @ 87 BPM, 16th notes
window.BLACK_TAB = {
  meta: {
    title: 'Black',
    artist: 'Pearl Jam',
    album: 'Ten',
    year: 1991,
    key: 'Em',
    tuning: 'E A D G B E',
    capo: 0,
    bpm: 87,
    duration: '5:45',
    writers: 'Stone Gossard / Eddie Vedder',
  },
  // 3 voices, cada uma com 2 linhas de 8 compassos
  voices: {
    stone: {
      label: 'Stone Gossard',
      role: 'Guitarra rítmica',
      tagline: 'arpejos limpos · base do Em–A–G',
      color: '#2e6b8a',
      strings: ['e', 'B', 'G', 'D', 'A', 'E'],
      lines: [
        {
          measure: 4,
          beats: [
            // [string-index, fret, pm?, accent?]
            { s: 5, f: 0 }, { s: 3, f: 2 }, { s: 4, f: 2 }, { s: 2, f: 0 },
            { s: 5, f: 0 }, { s: 3, f: 2 }, { s: 4, f: 2 }, { s: 2, f: 0 },
            { s: 4, f: 0 }, { s: 3, f: 2 }, { s: 5, f: 3 }, { s: 2, f: 0 },
            { s: 4, f: 2 }, { s: 3, f: 0 }, { s: 5, f: 0 }, { s: 2, f: 0 },
          ],
          pm: [0, 1, 2, 3], // palm-mute brackets nesses beats
        },
        {
          measure: 5,
          beats: [
            { s: 5, f: 0 }, { s: 4, f: 2 }, { s: 3, f: 2 }, { s: 2, f: 0 },
            { s: 4, f: 0 }, { s: 5, f: 3 }, { s: 3, f: 0 }, { s: 2, f: 0 },
            { s: 5, f: 0 }, { s: 3, f: 2 }, { s: 4, f: 2 }, { s: 2, f: 0 },
            { s: 4, f: 0 }, { s: 5, f: 3 }, { s: 3, f: 0 }, { s: 2, f: 0 },
          ],
          pm: [],
        },
      ],
    },
    mike: {
      label: 'Mike McCready',
      role: 'Guitarra solo',
      tagline: 'bends bluesy · pentatônica em Em',
      color: '#a0671e',
      strings: ['e', 'B', 'G', 'D', 'A', 'E'],
      lines: [
        {
          measure: 4,
          beats: [
            { s: 0, f: 12 }, { s: 0, f: 15, bend: true }, { s: 1, f: 15 }, { s: 0, f: 12 },
            { s: 1, f: 15 }, { s: 2, f: 14 }, { s: 1, f: 12 }, { s: 0, f: 12 },
            { s: 2, f: 12 }, { s: 1, f: 15, bend: true }, { s: 0, f: 15 }, { s: 1, f: 12 },
            { s: 0, f: 12 }, { s: 1, f: 15 }, { s: 2, f: 14 }, { s: 1, f: 12 },
          ],
          pm: [],
        },
        {
          measure: 5,
          beats: [
            { s: 2, f: 14 }, { s: 1, f: 15 }, { s: 0, f: 17, bend: true }, { s: 0, f: 15 },
            { s: 1, f: 12 }, { s: 2, f: 14 }, { s: 1, f: 15 }, { s: 0, f: 12 },
            { s: 0, f: 15 }, { s: 1, f: 15 }, { s: 2, f: 14 }, { s: 1, f: 12 },
            { s: 0, f: 12 }, { s: 1, f: 12 }, { s: 2, f: 12 }, { s: 0, f: 12 },
          ],
          pm: [],
        },
      ],
    },
    jeff: {
      label: 'Jeff Ament',
      role: 'Baixo',
      tagline: 'pulso steady · raízes E–G–D–A',
      color: '#5a8a52',
      strings: ['G', 'D', 'A', 'E'],
      lines: [
        {
          measure: 4,
          beats: [
            { s: 3, f: 0 }, { s: 3, f: 0 }, { s: 2, f: 0 }, { s: 2, f: 0 },
            { s: 2, f: 3 }, { s: 2, f: 3 }, { s: 1, f: 0 }, { s: 1, f: 0 },
            { s: 1, f: 5 }, { s: 1, f: 5 }, { s: 1, f: 7 }, { s: 0, f: 0 },
            { s: 0, f: 0 }, { s: 0, f: 2 }, { s: 1, f: 5 }, { s: 1, f: 3 },
          ],
          pm: [],
        },
        {
          measure: 5,
          beats: [
            { s: 3, f: 0 }, { s: 3, f: 0 }, { s: 2, f: 0 }, { s: 2, f: 0 },
            { s: 2, f: 3 }, { s: 2, f: 3 }, { s: 1, f: 0 }, { s: 1, f: 0 },
            { s: 1, f: 5 }, { s: 1, f: 5 }, { s: 1, f: 7 }, { s: 1, f: 7 },
            { s: 0, f: 0 }, { s: 0, f: 2 }, { s: 1, f: 5 }, { s: 1, f: 3 },
          ],
          pm: [],
        },
      ],
    },
  },
  // Catálogo lateral — quais músicas têm cifra. Só Black abre.
  catalog: [
    { key: 'black', title: 'Black', album: 'Ten', year: 1991, status: 'ready' },
    { key: 'alive', title: 'Alive', album: 'Ten', year: 1991, status: 'cifra-only' },
    { key: 'evenflow', title: 'Even Flow', album: 'Ten', year: 1991, status: 'cifra-only' },
    { key: 'jeremy', title: 'Jeremy', album: 'Ten', year: 1991, status: 'soon' },
    { key: 'yellow', title: 'Yellow Ledbetter', album: 'Lost Dogs', year: 2003, status: 'soon' },
    { key: 'better', title: 'Better Man', album: 'Vitalogy', year: 1994, status: 'soon' },
    { key: 'daughter', title: 'Daughter', album: 'Vs.', year: 1993, status: 'soon' },
    { key: 'corduroy', title: 'Corduroy', album: 'Vitalogy', year: 1994, status: 'soon' },
    { key: 'given', title: 'Given to Fly', album: 'Yield', year: 1998, status: 'soon' },
    { key: 'just', title: 'Just Breathe', album: 'Backspacer', year: 2009, status: 'soon' },
    { key: 'sirens', title: 'Sirens', album: 'Lightning Bolt', year: 2013, status: 'soon' },
    { key: 'rearview', title: 'Rearviewmirror', album: 'Vs.', year: 1993, status: 'soon' },
  ],
};
