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
  return createBuffer(ctx, 0.25, (t) => {
    const noise = Math.random() * 2 - 1;
    const freq = 80 + Math.sin(t * 30) * 60;
    const tone = Math.sin(2 * Math.PI * freq * t);
    const env = Math.sin(t / 0.25 * Math.PI);
    return (noise * 0.4 + tone * 0.6) * env * 0.7;
  });
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

export const DEFAULT_SAMPLES: SampleDef[] = [
  { name: 'KICK', color: '#ef4444', generate: kick },
  { name: 'SNARE', color: '#f97316', generate: snare },
  { name: 'HIHAT', color: '#eab308', generate: hihat },
  { name: 'CLAP', color: '#22c55e', generate: clap },
  { name: 'HORN', color: '#3b82f6', generate: airhorn },
  { name: 'SCRATCH', color: '#8b5cf6', generate: scratch },
  { name: 'DROP', color: '#ec4899', generate: drop },
  { name: 'SIREN', color: '#06b6d4', generate: siren },
];
