// Catálogo de músicas (apenas Black tem cifra completa neste momento)
// Em PT: "cifra" aqui = tablatura (tab) com partes para guitarra/violão.

window.PJ_SONGS = [
  // === TEN (1991) ===
  { id: "black",        title: "Black",        album: "Ten",        year: 1991, duration: "5:43", status: "ready",   plays: 1247, key: "E",   capo: 0, bpm: 76,  tuning: "E A D G B E" },
  { id: "alive",        title: "Alive",        album: "Ten",        year: 1991, duration: "5:41", status: "soon",    plays: 980,  key: "A",   capo: 0, bpm: 78,  tuning: "E A D G B E" },
  { id: "evenflow",     title: "Even Flow",    album: "Ten",        year: 1991, duration: "4:53", status: "soon",    plays: 760,  key: "E",   capo: 0, bpm: 76,  tuning: "E A D G B E" },
  { id: "jeremy",       title: "Jeremy",       album: "Ten",        year: 1991, duration: "5:19", status: "soon",    plays: 642,  key: "D",   capo: 0, bpm: 80,  tuning: "E A D G B E" },
  { id: "oceans",       title: "Oceans",       album: "Ten",        year: 1991, duration: "2:42", status: "soon",    plays: 312,  key: "E",   capo: 0, bpm: 102, tuning: "E A D G B E" },
  { id: "porch",        title: "Porch",        album: "Ten",        year: 1991, duration: "3:30", status: "soon",    plays: 287,  key: "A",   capo: 0, bpm: 128, tuning: "E A D G B E" },
  { id: "release",      title: "Release",      album: "Ten",        year: 1991, duration: "9:05", status: "soon",    plays: 401,  key: "A",   capo: 0, bpm: 60,  tuning: "E A D G B E" },

  // === VS. (1993) ===
  { id: "daughter",     title: "Daughter",     album: "Vs.",        year: 1993, duration: "3:55", status: "soon",    plays: 522,  key: "G",   capo: 0, bpm: 96,  tuning: "E A D G B E" },
  { id: "elderly",      title: "Elderly Woman Behind the Counter", album: "Vs.", year: 1993, duration: "3:15", status: "soon", plays: 478, key: "G", capo: 0, bpm: 92, tuning: "E A D G B E" },
  { id: "rearview",     title: "Rearviewmirror", album: "Vs.",     year: 1993, duration: "4:46", status: "soon",    plays: 365,  key: "F#m", capo: 0, bpm: 138, tuning: "E A D G B E" },
  { id: "dissident",    title: "Dissident",    album: "Vs.",        year: 1993, duration: "3:34", status: "soon",    plays: 198,  key: "C",   capo: 0, bpm: 116, tuning: "E A D G B E" },

  // === VITALOGY (1994) ===
  { id: "betterman",    title: "Better Man",   album: "Vitalogy",   year: 1994, duration: "4:27", status: "soon",    plays: 891,  key: "D",   capo: 0, bpm: 78,  tuning: "E A D G B E" },
  { id: "corduroy",     title: "Corduroy",     album: "Vitalogy",   year: 1994, duration: "4:35", status: "soon",    plays: 412,  key: "F#m", capo: 0, bpm: 142, tuning: "E A D G B E" },
  { id: "nothingman",   title: "Nothingman",   album: "Vitalogy",   year: 1994, duration: "4:35", status: "soon",    plays: 287,  key: "E",   capo: 0, bpm: 72,  tuning: "E A D G B E" },

  // === NO CODE (1996) ===
  { id: "offhegoes",    title: "Off He Goes",  album: "No Code",    year: 1996, duration: "6:03", status: "soon",    plays: 234,  key: "C",   capo: 0, bpm: 84,  tuning: "E A D G B E" },
  { id: "presenttense", title: "Present Tense", album: "No Code",   year: 1996, duration: "5:46", status: "soon",    plays: 198,  key: "E",   capo: 0, bpm: 96,  tuning: "E A D G B E" },

  // === YIELD (1998) ===
  { id: "given",        title: "Given to Fly", album: "Yield",      year: 1998, duration: "4:00", status: "soon",    plays: 367,  key: "D",   capo: 0, bpm: 80,  tuning: "E A D G B E" },
  { id: "wishlist",     title: "Wishlist",     album: "Yield",      year: 1998, duration: "3:26", status: "soon",    plays: 245,  key: "G",   capo: 0, bpm: 84,  tuning: "E A D G B E" },

  // === BINAURAL (2000) ===
  { id: "lightyears",   title: "Light Years",  album: "Binaural",   year: 2000, duration: "5:06", status: "soon",    plays: 156,  key: "A",   capo: 0, bpm: 130, tuning: "E A D G B E" },

  // === RIOT ACT (2002) ===
  { id: "iammine",      title: "I Am Mine",    album: "Riot Act",   year: 2002, duration: "3:36", status: "soon",    plays: 178,  key: "E",   capo: 0, bpm: 130, tuning: "E A D G B E" },

  // === AVOCADO (2006) ===
  { id: "comebck",      title: "Come Back",    album: "Pearl Jam",  year: 2006, duration: "5:30", status: "soon",    plays: 134,  key: "D",   capo: 0, bpm: 78,  tuning: "E A D G B E" },

  // === BACKSPACER (2009) ===
  { id: "justbreathe",  title: "Just Breathe", album: "Backspacer", year: 2009, duration: "3:34", status: "soon",    plays: 689,  key: "C",   capo: 0, bpm: 78,  tuning: "E A D G B E" },
  { id: "thefixer",     title: "The Fixer",    album: "Backspacer", year: 2009, duration: "2:57", status: "soon",    plays: 267,  key: "G",   capo: 0, bpm: 140, tuning: "E A D G B E" },

  // === LIGHTNING BOLT (2013) ===
  { id: "sirens",       title: "Sirens",       album: "Lightning Bolt", year: 2013, duration: "5:40", status: "soon", plays: 312, key: "G", capo: 0, bpm: 72, tuning: "E A D G B E" },

  // === GIGATON (2020) ===
  { id: "dance",        title: "Dance of the Clairvoyants", album: "Gigaton", year: 2020, duration: "4:33", status: "soon", plays: 178, key: "Em", capo: 0, bpm: 124, tuning: "E A D G B E" },

  // === DARK MATTER (2024) ===
  { id: "darkmatter",   title: "Dark Matter",  album: "Dark Matter", year: 2024, duration: "4:01", status: "soon",   plays: 245,  key: "Bm",  capo: 0, bpm: 145, tuning: "E A D G B E" },
];

// Paletas tematicas por album (extraidas das capas)
window.PJ_ALBUM_PALETTE = {
  "Ten":            { ink: "#F2C572", accent: "#C0392B", deep: "#1A1410", glow: "#E89C3D" },
  "Vs.":            { ink: "#E8E5DD", accent: "#3A3A3A", deep: "#0E0E0E", glow: "#A0A0A0" },
  "Vitalogy":       { ink: "#D4C5A0", accent: "#7A1A1A", deep: "#1F1812", glow: "#B89968" },
  "No Code":        { ink: "#D87330", accent: "#2A4A6E", deep: "#1A1A1F", glow: "#E89A4D" },
  "Yield":          { ink: "#F8E6B8", accent: "#3D6B3D", deep: "#0F1810", glow: "#D4B85C" },
  "Binaural":       { ink: "#6FB8D4", accent: "#1A3A5C", deep: "#0A1622", glow: "#9FD4E8" },
  "Riot Act":       { ink: "#C8B89C", accent: "#5C2A1A", deep: "#1A0F0A", glow: "#B89968" },
  "Pearl Jam":      { ink: "#D8C8B0", accent: "#5A4A38", deep: "#1A1612", glow: "#B89968" },
  "Backspacer":     { ink: "#F0D85C", accent: "#C82828", deep: "#1A0A0A", glow: "#F0D85C" },
  "Lightning Bolt": { ink: "#E8C868", accent: "#C82828", deep: "#0A0A14", glow: "#FFD83D" },
  "Gigaton":        { ink: "#7FCAD9", accent: "#1A4A5C", deep: "#0A1820", glow: "#9FE0EC" },
  "Dark Matter":    { ink: "#C82828", accent: "#7A1A1A", deep: "#100808", glow: "#F04040" },
};

// === TABLATURA DE "BLACK" ===
// 6 cordas: 0=E grave (mais grossa), 5=E aguda (mais fina)
// Cada nota: { s: corda (0-5), f: traste, t: beat (0-based, em semicolcheias),
//             pm: palm mute, sl: slide, bd: bend, h: hammer-on, p: pull-off, label?: anotacao }
// O intro do Black (em E) usa picking arpejado sobre E, A, D, G, Bm/B, A...
// Para fins visuais, ilustramos os primeiros 8 compassos.

window.PJ_TAB_BLACK = {
  sections: [
    { id: "intro",  label: "Intro",   bars: [0, 1, 2, 3], color: "#C0392B" },
    { id: "verse1", label: "Verse 1", bars: [4, 5, 6, 7], color: "#E89C3D" },
    { id: "chorus", label: "Chorus",  bars: [8, 9],       color: "#7A1A1A" },
    { id: "solo",   label: "Solo",    bars: [10, 11],     color: "#F2C572" },
  ],
  // 8 compassos x 16 semicolcheias por compasso
  measures: [
    // m1 — E maj arpejo aberto: 0,2,2,1,0,0 (EADGBE)
    { idx: 1, beats: 16, notes: [
      { s: 0, f: 0, t: 0 },  { s: 4, f: 0, t: 2 },  { s: 3, f: 1, t: 4 },  { s: 2, f: 2, t: 6 },
      { s: 1, f: 2, t: 8 },  { s: 2, f: 2, t: 10 }, { s: 3, f: 1, t: 12 }, { s: 4, f: 0, t: 14 },
    ]},
    // m2 — variacao do E
    { idx: 2, beats: 16, notes: [
      { s: 0, f: 0, t: 0 },  { s: 4, f: 2, t: 2 },  { s: 3, f: 1, t: 4 },  { s: 2, f: 2, t: 6 },
      { s: 1, f: 0, t: 8 },  { s: 2, f: 2, t: 10 }, { s: 3, f: 1, t: 12 }, { s: 4, f: 0, t: 14 },
    ]},
    // m3 — A maj: x,0,2,2,2,0
    { idx: 3, beats: 16, notes: [
      { s: 1, f: 0, t: 0 },  { s: 4, f: 2, t: 2 },  { s: 3, f: 2, t: 4 },  { s: 2, f: 2, t: 6 },
      { s: 5, f: 0, t: 8 },  { s: 2, f: 2, t: 10 }, { s: 3, f: 2, t: 12 }, { s: 4, f: 2, t: 14 },
    ]},
    // m4 — riff palm-muted similar ao da referencia (P.M.)
    { idx: 4, beats: 16, pm: [[0, 3], [4, 7], [8, 11], [12, 15]], notes: [
      { s: 0, f: 4, t: 0, pm: true },  { s: 3, f: 0, t: 2, pm: true },  { s: 0, f: 4, t: 3, pm: true },
      { s: 3, f: 2, t: 4, pm: true },  { s: 0, f: 4, t: 5, pm: true },  { s: 3, f: 0, t: 6, pm: true },
      { s: 0, f: 4, t: 7, pm: true },  { s: 3, f: 4, t: 8, pm: true },  { s: 0, f: 4, t: 10, pm: true },
      { s: 0, f: 4, t: 11, pm: true }, { s: 3, f: 0, t: 12, pm: true }, { s: 0, f: 4, t: 13, pm: true },
      { s: 3, f: 2, t: 14, pm: true }, { s: 0, f: 4, t: 15, pm: true, slide: "down" },
    ]},
    // m5 — variacao no 11o traste (similar ao da referencia "11 0 9 0")
    { idx: 5, beats: 16, pm: [[0, 3], [4, 7], [8, 11], [12, 15]], notes: [
      { s: 0, f: 11, t: 0, pm: true }, { s: 3, f: 0, t: 1, pm: true },  { s: 3, f: 9, t: 2, pm: true },
      { s: 3, f: 0, t: 3, pm: true },  { s: 0, f: 11, t: 4, pm: true }, { s: 0, f: 11, t: 5, pm: true },
      { s: 0, f: 11, t: 6, pm: true }, { s: 3, f: 11, t: 7, pm: true }, { s: 0, f: 11, t: 8, pm: true },
      { s: 3, f: 0, t: 9, pm: true },  { s: 3, f: 9, t: 10, pm: true }, { s: 3, f: 0, t: 11, pm: true },
      { s: 0, f: 11, t: 12, pm: true },{ s: 0, f: 11, t: 13, pm: true },{ s: 3, f: 0, t: 14, pm: true },
      { s: 3, f: 0, t: 15, pm: true },
    ]},
    // m6 — D maj arpejo: x,x,0,2,3,2
    { idx: 6, beats: 16, notes: [
      { s: 2, f: 0, t: 0 },  { s: 5, f: 2, t: 2 },  { s: 4, f: 3, t: 4 },  { s: 3, f: 2, t: 6 },
      { s: 2, f: 0, t: 8 },  { s: 3, f: 2, t: 10 }, { s: 4, f: 3, t: 12 }, { s: 5, f: 2, t: 14 },
    ]},
    // m7 — B (barre na 2): x,2,4,4,4,2 -> intro alternada
    { idx: 7, beats: 16, notes: [
      { s: 1, f: 2, t: 0 },  { s: 4, f: 4, t: 2 },  { s: 3, f: 4, t: 4 },  { s: 2, f: 4, t: 6 },
      { s: 5, f: 2, t: 8 },  { s: 2, f: 4, t: 10 }, { s: 3, f: 4, t: 12 }, { s: 4, f: 4, t: 14 },
    ]},
    // m8 — A maj fim de frase + bend leve
    { idx: 8, beats: 16, notes: [
      { s: 1, f: 0, t: 0 },  { s: 4, f: 2, t: 2 },  { s: 3, f: 2, t: 4 },  { s: 2, f: 2, t: 6 },
      { s: 5, f: 0, t: 8 },  { s: 2, f: 2, t: 10 }, { s: 3, f: 4, t: 12, bend: true }, { s: 4, f: 2, t: 14 },
    ]},
  ],
};

// Letra (curta, posicionada por compasso) — usada no overlay opcional
window.PJ_BLACK_LYRICS = [
  { measure: 5, text: "Sheets of empty canvas..." },
  { measure: 6, text: "...untouched sheets of clay" },
  { measure: 7, text: "Were laid spread out before me" },
  { measure: 8, text: "As her body once did..." },
];
