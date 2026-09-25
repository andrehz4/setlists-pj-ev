// Extrai o áudio do vídeo no próprio navegador: WAV 16 kHz mono, ~2 MB por minuto.
// É isso que vai pro Whisper; o vídeo inteiro nunca é enviado pra transcrição.

const TAXA = 16000;

export async function extrairWav(arquivo, maxSeg = 180) {
  const bruto = await arquivo.arrayBuffer();
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  let audio;
  try {
    audio = await ctx.decodeAudioData(bruto);
  } catch (_) {
    throw new Error("Não consegui ler o áudio desse vídeo. Tente outro formato (MP4) ou escreva a legenda.");
  } finally {
    ctx.close?.();
  }
  const dur = Math.min(audio.duration, maxSeg);
  const off = new OfflineAudioContext(1, Math.ceil(dur * TAXA), TAXA);
  const fonte = off.createBufferSource();
  fonte.buffer = audio;
  fonte.connect(off.destination);
  fonte.start(0, 0, dur);
  const mono = await off.startRendering();
  return paraWav(mono.getChannelData(0));
}

function paraWav(amostras) {
  const buf = new ArrayBuffer(44 + amostras.length * 2);
  const v = new DataView(buf);
  const txt = (pos, s) => { for (let i = 0; i < s.length; i++) v.setUint8(pos + i, s.charCodeAt(i)); };
  txt(0, "RIFF");
  v.setUint32(4, 36 + amostras.length * 2, true);
  txt(8, "WAVE");
  txt(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, TAXA, true);
  v.setUint32(28, TAXA * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  txt(36, "data");
  v.setUint32(40, amostras.length * 2, true);
  for (let i = 0; i < amostras.length; i++) {
    const s = Math.max(-1, Math.min(1, amostras[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buf], { type: "audio/wav" });
}
