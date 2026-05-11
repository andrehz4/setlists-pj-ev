/* eslint-disable */
const { useState, useEffect, useRef, useMemo } = React;

// Linha de tablatura (papel kraft do site, igual referência mas com a paleta dele)
const TabLine = ({ line, voice, activeBeatGlobal, lineOffset, isPlaying }) => {
  const numStrings = voice.strings.length;
  const ROW_H = 16;
  const HEIGHT = ROW_H * (numStrings - 1) + 36;
  const BEATS = line.beats.length;
  const BEAT_W = 56;
  const PAD_L = 26;
  const PAD_R = 18;
  const WIDTH = PAD_L + BEATS * BEAT_W + PAD_R;
  const localActive = isPlaying ? activeBeatGlobal - lineOffset : -1;

  // Agrupa P.M. em segments contíguos
  const pmSegments = [];
  if (line.pm && line.pm.length) {
    let start = line.pm[0], end = start;
    for (let i = 1; i < line.pm.length; i++) {
      if (line.pm[i] === end + 1) end = line.pm[i];
      else { pmSegments.push([start, end]); start = end = line.pm[i]; }
    }
    pmSegments.push([start, end]);
  }

  return (
    <div className="tab-line-wrap">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* P.M. brackets em cima */}
        {pmSegments.map(([a, b], i) => {
          const x1 = PAD_L + a * BEAT_W - 6;
          const x2 = PAD_L + b * BEAT_W + 14;
          return (
            <g key={i}>
              <text x={x1} y={10} fontSize="9" fontFamily="JetBrains Mono, monospace" fill="#5a5245" letterSpacing="0.05em">P.M.</text>
              <line x1={x1 + 24} y1={8} x2={x2} y2={8} stroke="#5a5245" strokeWidth="0.7" strokeDasharray="2 2.5" />
              <line x1={x2} y1={5} x2={x2} y2={11} stroke="#5a5245" strokeWidth="0.7" />
            </g>
          );
        })}
        {/* Número do compasso */}
        <text x={PAD_L - 18} y={22} fontSize="9" fontFamily="JetBrains Mono, monospace" fill="#9c1f22" fontWeight="700">{line.measure}</text>

        {/* Linhas das cordas */}
        {Array.from({ length: numStrings }).map((_, i) => (
          <line key={i} x1={PAD_L - 4} y1={16 + i * ROW_H} x2={WIDTH - PAD_R + 4} y2={16 + i * ROW_H} stroke="#8a7f6d" strokeWidth="0.6" opacity="0.85" />
        ))}
        {/* Bar lines */}
        <line x1={PAD_L - 4} y1={16} x2={PAD_L - 4} y2={16 + (numStrings - 1) * ROW_H} stroke="#5a5245" strokeWidth="1" />
        <line x1={WIDTH - PAD_R + 4} y1={16} x2={WIDTH - PAD_R + 4} y2={16 + (numStrings - 1) * ROW_H} stroke="#5a5245" strokeWidth="1" />

        {/* Notas */}
        {line.beats.map((b, idx) => {
          const x = PAD_L + idx * BEAT_W;
          const y = 16 + b.s * ROW_H;
          const isActive = localActive === idx;
          const txt = b.bend ? `${b.f}` + '^' : `${b.f}`;
          return (
            <g key={idx}>
              {/* Fundo branco mascara a linha sob o número */}
              <rect x={x - 9} y={y - 6} width={txt.length * 6 + 4} height={11} fill="#f7f1e3" rx="1" />
              <text
                x={x}
                y={y + 3.5}
                textAnchor="middle"
                fontSize="11"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="700"
                fill={isActive ? voice.color : '#1a1612'}
              >
                {txt}
              </text>
              {isActive && (
                <rect x={x - 10} y={y - 7} width={txt.length * 6 + 6} height={13} fill="none" stroke={voice.color} strokeWidth="1.4" rx="2">
                  <animate attributeName="opacity" values="1;0.4;1" dur="0.3s" repeatCount="indefinite" />
                </rect>
              )}
              {/* Marca rítmica embaixo (hastes simples) */}
              <line x1={x} y1={16 + (numStrings - 1) * ROW_H + 4} x2={x} y2={16 + (numStrings - 1) * ROW_H + 14} stroke="#5a5245" strokeWidth="0.7" />
              {idx % 2 === 0 && (
                <line x1={x} y1={16 + (numStrings - 1) * ROW_H + 14} x2={x + BEAT_W} y2={16 + (numStrings - 1) * ROW_H + 14} stroke="#5a5245" strokeWidth="0.7" />
              )}
            </g>
          );
        })}

        {/* Playhead vermelho */}
        {isPlaying && localActive >= 0 && localActive < BEATS && (
          <line
            x1={PAD_L + localActive * BEAT_W}
            y1={10}
            x2={PAD_L + localActive * BEAT_W}
            y2={HEIGHT - 12}
            stroke="#9c1f22"
            strokeWidth="1.2"
            opacity="0.85"
          />
        )}
      </svg>
    </div>
  );
};

// View principal de cifra/tab — fica dentro da seção "Cifras & Tabs" do site
const CifraDetail = ({ song, tweaks, onClose }) => {
  const [voiceKey, setVoiceKey] = useState('stone');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBeat, setActiveBeat] = useState(0);
  const [speed, setSpeed] = useState(0.60);
  const [loop, setLoop] = useState(false);
  const [metronome, setMetronome] = useState(false);
  const [showFretboard, setShowFretboard] = useState(true);
  const [showFormat, setShowFormat] = useState('tab'); // 'tab' | 'cifra'
  const voice = song.voices[voiceKey];
  const totalBeats = voice.lines.reduce((acc, l) => acc + l.beats.length, 0);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = (60 / song.meta.bpm / 4) * 1000 / Math.max(speed, 0.1);
    const id = setInterval(() => {
      setActiveBeat(prev => {
        const next = prev + 1;
        if (next >= totalBeats) {
          if (loop) return 0;
          setIsPlaying(false);
          return 0;
        }
        return next;
      });
    }, interval);
    return () => clearInterval(id);
  }, [isPlaying, speed, totalBeats, loop, song.meta.bpm]);

  // Som do metrônomo (web audio simples)
  useEffect(() => {
    if (!isPlaying || !metronome) return;
    if (activeBeat % 4 !== 0) return;
    try {
      const ctx = window._ctx || (window._ctx = new (window.AudioContext || window.webkitAudioContext)());
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = activeBeat === 0 ? 1200 : 800;
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  }, [activeBeat, metronome, isPlaying]);

  // Chord chips (cifra view) — pseudo-data pra Black no Em
  const chordProgression = useMemo(() => [
    { chord: 'Em', lyric: 'Sheets of empty canvas' },
    { chord: 'A', lyric: 'untouched sheets of clay' },
    { chord: 'Em', lyric: 'Were laid spread out before me' },
    { chord: 'A', lyric: 'as her body once did' },
    { chord: 'G', lyric: 'All five horizons' },
    { chord: 'D', lyric: 'revolved around her soul' },
    { chord: 'C', lyric: 'as the earth to the sun' },
    { chord: 'D', lyric: 'now the air I tasted and breathed' },
  ], []);

  // Atalhos
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') { e.preventDefault(); setIsPlaying(p => !p); }
      if (e.key === 'Escape') onClose && onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="cifra-detail" data-paper={tweaks.paper}>
      {/* Stamps decorativos (PJ sun + stickman) — só se tweak ligado */}
      {tweaks.stamps !== 'none' && (
        <>
          <img className="stamp stamp-sun" src="assets/pj-sun-logo.png" alt="" aria-hidden="true" />
          <img className="stamp stamp-stickman" src="assets/pj-stickman.png" alt="" aria-hidden="true" />
        </>
      )}

      {/* Header da música */}
      <div className="cifra-header">
        <button className="cifra-back" onClick={onClose} aria-label="Voltar pra lista">← lista</button>
        <div className="cifra-cover" aria-hidden="true">
          <div className="cover-ten">
            <div className="cover-figures">
              {[0,1,2,3,4].map(i => (
                <div key={i} className="figure" style={{ left: `${10 + i * 17}%` }} />
              ))}
            </div>
            <div className="cover-glow" />
          </div>
        </div>
        <div className="cifra-titlebox">
          <div className="cifra-album-line">PEARL JAM · TEN · 1991</div>
          <h1 className="cifra-songtitle">{song.meta.title}</h1>
          <div className="cifra-songsub">{song.meta.writers}</div>
          <div className="cifra-pills">
            <span className="tab-pill">{song.meta.key}</span>
            <span className="tab-pill tab-pill-alt">{song.meta.tuning}</span>
            <span className="tab-pill tab-pill-alt">capo {song.meta.capo}</span>
            <span className="tab-pill tab-pill-alt">{song.meta.bpm} BPM</span>
            <span className="tab-pill tab-pill-alt">{song.meta.duration}</span>
          </div>
        </div>
      </div>

      {/* Switch CIFRA / TAB — igual lyric-lang-bar do site */}
      <div className="cifra-format-bar" role="tablist" aria-label="Formato">
        <button role="tab" aria-pressed={showFormat === 'tab'} className={'cifra-format-btn' + (showFormat === 'tab' ? ' active' : '')} onClick={() => setShowFormat('tab')}>Tab</button>
        <button role="tab" aria-pressed={showFormat === 'cifra'} className={'cifra-format-btn' + (showFormat === 'cifra' ? ' active' : '')} onClick={() => setShowFormat('cifra')}>Cifra</button>
      </div>

      {/* Voice picker — Stone / Mike / Jeff */}
      <div className="voice-picker" role="radiogroup" aria-label="Acompanhar músico">
        {Object.entries(song.voices).map(([k, v]) => (
          <button
            key={k}
            role="radio"
            aria-checked={voiceKey === k}
            className={'voice-tab' + (voiceKey === k ? ' active' : '')}
            onClick={() => { setVoiceKey(k); setActiveBeat(0); }}
            style={{ '--vc': v.color }}
          >
            {v.photo && (
              <div
                className="voice-tab-photo"
                style={{ backgroundImage: 'url(' + v.photo + ')', backgroundPosition: v.photoPos || '50% 25%' }}
                aria-hidden="true"
              />
            )}
            <div className="voice-tab-scrim" aria-hidden="true" />
            <div className="voice-tab-content">
              <span className="voice-tab-label">{v.label}</span>
              <span className="voice-tab-role">{v.role}</span>
              <span className="voice-tab-tag">{v.tagline}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Corpo: TAB ou CIFRA */}
      {showFormat === 'tab' ? (
        <div className="tab-paper">
          {(() => {
            let offset = 0;
            return voice.lines.map((line, idx) => {
              const o = offset;
              offset += line.beats.length;
              return <TabLine key={idx} line={line} voice={voice} activeBeatGlobal={activeBeat} lineOffset={o} isPlaying={isPlaying} />;
            });
          })()}
        </div>
      ) : (
        <div className="cifra-paper">
          {chordProgression.map((c, i) => (
            <div key={i} className="cifra-line-row">
              <span className="chord-chip" style={{ background: voice.color }}>{c.chord}</span>
              <span className="cifra-syl">{c.lyric}</span>
            </div>
          ))}
        </div>
      )}

      {/* Fretboard animado */}
      {showFretboard && (
        <div className="fretboard-wrap">
          <Fretboard voice={voice} activeBeat={activeBeat} isPlaying={isPlaying} />
        </div>
      )}

      {/* Controles inferiores — igual referência */}
      <div className="cifra-controls">
        <div className="ctrl-group">
          <span className="ctrl-ico" aria-hidden="true">{
            /* speaker */
          }🔊</span>
          <input type="range" min="0" max="1" step="0.05" defaultValue="0.6" className="ctrl-slider" aria-label="Volume" />
        </div>
        <button className="ctrl-btn" onClick={() => setActiveBeat(0)} aria-label="Voltar ao início">⏮</button>
        <button className={'ctrl-play' + (isPlaying ? ' playing' : '')} onClick={() => setIsPlaying(p => !p)} aria-label={isPlaying ? 'Pausar' : 'Tocar'}>
          {isPlaying ? '❚❚' : '▶'}
        </button>
        <div className="ctrl-group ctrl-speed">
          <span className="ctrl-label">speed</span>
          <input type="range" min="0.25" max="1.5" step="0.05" value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} className="ctrl-slider" aria-label="Velocidade" />
          <span className="ctrl-val">{speed.toFixed(2)}</span>
        </div>
        <div className="ctrl-spacer" />
        <button className={'ctrl-toggle' + (loop ? ' on' : '')} onClick={() => setLoop(l => !l)}>↻ loop</button>
        <button className={'ctrl-toggle' + (metronome ? ' on' : '')} onClick={() => setMetronome(m => !m)}>𝅘𝅥 metrônomo</button>
        <button className={'ctrl-toggle' + (showFretboard ? ' on' : '')} onClick={() => setShowFretboard(f => !f)}>⌗ braço</button>
        <button className="ctrl-toggle" aria-label="Ajustes">⚙</button>
      </div>
    </div>
  );
};

window.CifraDetail = CifraDetail;
