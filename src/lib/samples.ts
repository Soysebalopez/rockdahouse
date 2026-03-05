// Generate short audio samples as AudioBuffers using Web Audio API synthesis
// No external files needed — all samples are synthesized on-the-fly

export interface SampleDef {
  name: string;
  color: string;
  generate: (ctx: AudioContext) => AudioBuffer;
}

function createBuffer(ctx: AudioContext, duration: number, fn: (t: number, i: number, buf: Float32Array) => number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    data[i] = Math.max(-1, Math.min(1, fn(t, i, data)));
  }
  return buffer;
}

function kick(ctx: AudioContext): AudioBuffer {
  return createBuffer(ctx, 0.3, (t) => {
    const freq = 150 * Math.exp(-t * 20);
    const env = Math.exp(-t * 8);
    return Math.sin(2 * Math.PI * freq * t) * env;
  });
}

function snare(ctx: AudioContext): AudioBuffer {
  return createBuffer(ctx, 0.2, (t) => {
    const body = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 20);
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 15);
    return (body * 0.5 + noise * 0.7);
  });
}

function hihat(ctx: AudioContext): AudioBuffer {
  return createBuffer(ctx, 0.08, (t) => {
    const noise = (Math.random() * 2 - 1);
    const env = Math.exp(-t * 60);
    return noise * env * 0.6;
  });
}

function clap(ctx: AudioContext): AudioBuffer {
  return createBuffer(ctx, 0.15, (t) => {
    const noise = (Math.random() * 2 - 1);
    // Multiple short bursts
    const burst1 = t < 0.01 ? 1 : 0;
    const burst2 = t > 0.015 && t < 0.025 ? 1 : 0;
    const burst3 = t > 0.03 && t < 0.04 ? 1 : 0;
    const tail = t > 0.04 ? Math.exp(-(t - 0.04) * 30) : 0;
    return noise * (burst1 + burst2 + burst3 + tail) * 0.8;
  });
}

function airhorn(ctx: AudioContext): AudioBuffer {
  return createBuffer(ctx, 0.8, (t) => {
    const f1 = Math.sin(2 * Math.PI * 480 * t);
    const f2 = Math.sin(2 * Math.PI * 620 * t);
    const f3 = Math.sin(2 * Math.PI * 760 * t);
    const env = Math.min(1, t * 20) * Math.exp(-t * 1.5);
    return (f1 + f2 * 0.7 + f3 * 0.5) * env * 0.3;
  });
}

function scratch(ctx: AudioContext): AudioBuffer {
  // Short "baby scratch" — one quick forward-back chirp
  // Uses phase accumulation for realistic vinyl speed changes
  const sampleRate = ctx.sampleRate;
  const duration = 0.3;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  let phase = 0;

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    // Speed curve: fast forward then fast back (asymmetric for realism)
    const norm = t / duration;
    const speed = norm < 0.4
      ? Math.sin(norm / 0.4 * Math.PI) * 2.5       // forward push
      : -Math.sin((norm - 0.4) / 0.6 * Math.PI) * 1.8; // pull back (slower)

    // Accumulate phase — this is what makes it sound like a real record
    phase += speed * 280 / sampleRate;

    // Rich source: sawtooth + harmonics (simulates music content on vinyl)
    const saw = 2 * (phase - Math.floor(phase + 0.5));
    const harm2 = Math.sin(2 * Math.PI * phase * 2) * 0.3;
    const harm3 = Math.sin(2 * Math.PI * phase * 3.01) * 0.15;
    const source = saw * 0.6 + harm2 + harm3;

    // Vinyl texture: light crackle + hiss
    const hiss = (Math.random() * 2 - 1) * 0.08;
    const crackle = Math.random() < 0.02 ? (Math.random() - 0.5) * 0.4 : 0;

    // Amplitude envelope
    const env = Math.min(1, t * 40) * Math.min(1, (duration - t) * 20);

    data[i] = Math.max(-1, Math.min(1, (source + hiss + crackle) * env * 0.75));
  }
  return buffer;
}

function drop(ctx: AudioContext): AudioBuffer {
  return createBuffer(ctx, 0.5, (t) => {
    const freq = 800 * Math.exp(-t * 8);
    const env = Math.exp(-t * 4);
    return Math.sin(2 * Math.PI * freq * t) * env * 0.8;
  });
}

function siren(ctx: AudioContext): AudioBuffer {
  return createBuffer(ctx, 1.0, (t) => {
    const freq = 600 + 300 * Math.sin(2 * Math.PI * 3 * t);
    const env = Math.min(1, t * 10) * Math.min(1, (1 - t) * 10);
    return Math.sin(2 * Math.PI * freq * t) * env * 0.5;
  });
}

function scratchLong(ctx: AudioContext): AudioBuffer {
  // Long "transformer scratch" — multiple wicky-wicky chirps
  const sampleRate = ctx.sampleRate;
  const duration = 0.8;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  let phase = 0;

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const norm = t / duration;

    // 3 back-and-forth movements with decreasing intensity
    // Each cycle: fast forward chirp + pull back
    const cycleRate = 7; // Hz — speed of back-and-forth
    const speed = Math.sin(2 * Math.PI * cycleRate * t)
      * (2.5 - norm * 1.5) // slow down over time
      * (1 + 0.5 * Math.sin(2 * Math.PI * 1.5 * t)); // add rhythmic variation

    phase += speed * 320 / sampleRate;

    // Rich harmonic source (sawtooth + sub harmonics = "music on record")
    const saw = 2 * (phase - Math.floor(phase + 0.5));
    const sub = Math.sin(2 * Math.PI * phase * 0.5) * 0.2;
    const harm2 = Math.sin(2 * Math.PI * phase * 2.02) * 0.25;
    const harm4 = Math.sin(2 * Math.PI * phase * 4.01) * 0.1;
    const source = saw * 0.55 + sub + harm2 + harm4;

    // Vinyl texture
    const hiss = (Math.random() * 2 - 1) * 0.06;
    const crackle = Math.random() < 0.03 ? (Math.random() - 0.5) * 0.35 : 0;

    // "Transformer" effect: quick volume cuts that real DJs do with the fader
    const cutFreq = 14; // Hz
    const cut = (Math.sin(2 * Math.PI * cutFreq * t) > -0.3) ? 1 : 0.05;

    const env = Math.min(1, t * 20) * Math.min(1, (duration - t) * 12);

    data[i] = Math.max(-1, Math.min(1, (source + hiss + crackle) * env * cut * 0.7));
  }
  return buffer;
}

function rim(ctx: AudioContext): AudioBuffer {
  return createBuffer(ctx, 0.05, (t) => {
    const tone = Math.sin(2 * Math.PI * 1800 * t) * Math.exp(-t * 80);
    const click = (t < 0.002 ? 1 : 0) * 0.8;
    return (tone * 0.6 + click);
  });
}

function tom(ctx: AudioContext): AudioBuffer {
  return createBuffer(ctx, 0.35, (t) => {
    const freq = 120 * Math.exp(-t * 6);
    const env = Math.exp(-t * 10);
    return Math.sin(2 * Math.PI * freq * t) * env * 0.9;
  });
}

function cowbell(ctx: AudioContext): AudioBuffer {
  return createBuffer(ctx, 0.15, (t) => {
    const f1 = Math.sin(2 * Math.PI * 545 * t);
    const f2 = Math.sin(2 * Math.PI * 810 * t);
    const env = Math.exp(-t * 20);
    return (f1 + f2 * 0.7) * env * 0.4;
  });
}

function rewind(ctx: AudioContext): AudioBuffer {
  return createBuffer(ctx, 0.7, (t) => {
    // Rising pitch = tape rewind effect
    const freq = 100 * Math.exp(t * 5);
    const tone = Math.sin(2 * Math.PI * freq * t);
    const noise = (Math.random() * 2 - 1) * 0.15;
    const env = Math.min(1, t * 8) * Math.min(1, (0.7 - t) * 6);
    return (tone * 0.6 + noise) * env * 0.7;
  });
}

function laser(ctx: AudioContext): AudioBuffer {
  return createBuffer(ctx, 0.3, (t) => {
    // Descending high-pitched sweep
    const freq = 3000 * Math.exp(-t * 12);
    const env = Math.exp(-t * 6);
    return Math.sin(2 * Math.PI * freq * t) * env * 0.5;
  });
}

function stab(ctx: AudioContext): AudioBuffer {
  return createBuffer(ctx, 0.2, (t) => {
    // Chord stab — stacked 5ths
    const f1 = Math.sin(2 * Math.PI * 261 * t);
    const f2 = Math.sin(2 * Math.PI * 329 * t);
    const f3 = Math.sin(2 * Math.PI * 392 * t);
    const env = Math.exp(-t * 12);
    return (f1 + f2 * 0.8 + f3 * 0.6) * env * 0.35;
  });
}

function noise(ctx: AudioContext): AudioBuffer {
  return createBuffer(ctx, 0.6, (t) => {
    // White noise burst with filter sweep feel
    const n = Math.random() * 2 - 1;
    const env = Math.min(1, t * 20) * Math.min(1, (0.6 - t) * 5);
    return n * env * 0.5;
  });
}

export const DEFAULT_SAMPLES: SampleDef[] = [
  // Row 1 — Drums
  { name: 'KICK', color: '#ef4444', generate: kick },
  { name: 'SNARE', color: '#f97316', generate: snare },
  { name: 'HIHAT', color: '#eab308', generate: hihat },
  { name: 'CLAP', color: '#22c55e', generate: clap },
  // Row 2 — Percussion
  { name: 'RIM', color: '#f43f5e', generate: rim },
  { name: 'TOM', color: '#d946ef', generate: tom },
  { name: 'COWBELL', color: '#a855f7', generate: cowbell },
  { name: 'HORN', color: '#3b82f6', generate: airhorn },
  // Row 3 — DJ FX
  { name: 'SCRATCH', color: '#8b5cf6', generate: scratch },
  { name: 'SCRCH2', color: '#7c3aed', generate: scratchLong },
  { name: 'REWIND', color: '#2dd4bf', generate: rewind },
  { name: 'DROP', color: '#ec4899', generate: drop },
  // Row 4 — Synth
  { name: 'SIREN', color: '#06b6d4', generate: siren },
  { name: 'LASER', color: '#14b8a6', generate: laser },
  { name: 'STAB', color: '#f59e0b', generate: stab },
  { name: 'NOISE', color: '#64748b', generate: noise },
];
