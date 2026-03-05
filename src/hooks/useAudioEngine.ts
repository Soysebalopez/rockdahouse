/**
 * Audio Engine — Web Audio API pipeline for real EQ, volume, and analysis.
 *
 * Module-level singleton (not React state) to avoid re-render overhead.
 * Shared AudioContext used by both decks and sampler.
 *
 * Per-deck graph:
 *   HTMLAudioElement
 *   → MediaElementAudioSourceNode
 *   → BiquadFilter (lowshelf 320Hz)   ← 3-band EQ
 *   → BiquadFilter (peaking 1kHz)
 *   → BiquadFilter (highshelf 3.2kHz)
 *   → BiquadFilter ×8 (32–4kHz)       ← 8-band EQ panel
 *   → GainNode (deck volume)
 *   → GainNode (crossfader side A/B)
 *   → masterGain → masterAnalyser → destination
 */

import type { DeckId } from '@/lib/types';

// --- Singleton AudioContext ---

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let masterAnalyser: AnalyserNode | null = null;
let crossfaderGainA: GainNode | null = null;
let crossfaderGainB: GainNode | null = null;

export function getAudioContext(): AudioContext | null {
  return audioCtx;
}

export function getMasterAnalyserNode(): AnalyserNode | null {
  return masterAnalyser;
}

export function getMasterGainNode(): GainNode | null {
  return masterGain;
}

export function getCrossfaderGainA(): GainNode | null {
  return crossfaderGainA;
}

export function getCrossfaderGainB(): GainNode | null {
  return crossfaderGainB;
}

function ensureContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();

    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.8;

    masterAnalyser = audioCtx.createAnalyser();
    masterAnalyser.fftSize = 256;
    masterAnalyser.smoothingTimeConstant = 0.8;

    // Crossfader side gains → master gain → analyser → destination
    crossfaderGainA = audioCtx.createGain();
    crossfaderGainB = audioCtx.createGain();
    crossfaderGainA.connect(masterGain);
    crossfaderGainB.connect(masterGain);
    masterGain.connect(masterAnalyser);
    masterAnalyser.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// --- Per-deck graph ---

interface DeckGraph {
  audio: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  // 3-band EQ
  eqLow: BiquadFilterNode;
  eqMid: BiquadFilterNode;
  eqHigh: BiquadFilterNode;
  // 8-band EQ
  eqBands: BiquadFilterNode[];
  // Filter sweep (for effects)
  filterSweep: BiquadFilterNode;
  // Volume
  deckGain: GainNode;
  // Per-deck analyser for VU
  analyser: AnalyserNode;
  // Which crossfader side this deck is connected to
  crossfaderSide: 'A' | 'B';
  // Current connection to crossfader gain node
  crossfaderConnection: GainNode;
}

const deckGraphs = new Map<DeckId, DeckGraph>();

// 8-band center frequencies
const BAND_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000];

export function createDeckGraph(deckId: DeckId, proxyUrl: string, crossfaderSide: 'A' | 'B' = 'A'): DeckGraph {
  // Destroy existing graph for this deck
  destroyDeckGraph(deckId);

  const ctx = ensureContext();

  const audio = new Audio();
  audio.crossOrigin = 'anonymous';
  audio.preload = 'auto';
  audio.src = proxyUrl;

  const source = ctx.createMediaElementSource(audio);

  // 3-band EQ
  const eqLow = ctx.createBiquadFilter();
  eqLow.type = 'lowshelf';
  eqLow.frequency.value = 320;
  eqLow.gain.value = 0;

  const eqMid = ctx.createBiquadFilter();
  eqMid.type = 'peaking';
  eqMid.frequency.value = 1000;
  eqMid.Q.value = 0.7;
  eqMid.gain.value = 0;

  const eqHigh = ctx.createBiquadFilter();
  eqHigh.type = 'highshelf';
  eqHigh.frequency.value = 3200;
  eqHigh.gain.value = 0;

  // 8-band EQ
  const eqBands = BAND_FREQUENCIES.map((freq) => {
    const filter = ctx.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = freq;
    filter.Q.value = 1.4;
    filter.gain.value = 0;
    return filter;
  });

  // Filter sweep node (for effects — starts at 20kHz lowpass = transparent)
  const filterSweep = ctx.createBiquadFilter();
  filterSweep.type = 'lowpass';
  filterSweep.frequency.value = 20000;
  filterSweep.Q.value = 1;

  // Deck volume
  const deckGain = ctx.createGain();
  deckGain.gain.value = 0.8;

  // Per-deck analyser (for VU meters)
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.85;

  // Wire the chain
  source.connect(eqLow);
  eqLow.connect(eqMid);
  eqMid.connect(eqHigh);

  // 3-band → 8-band chain
  let lastNode: AudioNode = eqHigh;
  for (const band of eqBands) {
    lastNode.connect(band);
    lastNode = band;
  }

  // 8-band → filter sweep → deck gain → analyser → crossfader side
  lastNode.connect(filterSweep);
  filterSweep.connect(deckGain);
  deckGain.connect(analyser);

  const crossfaderConnection = crossfaderSide === 'A' ? crossfaderGainA! : crossfaderGainB!;
  analyser.connect(crossfaderConnection);

  const graph: DeckGraph = {
    audio,
    source,
    eqLow,
    eqMid,
    eqHigh,
    eqBands,
    filterSweep,
    deckGain,
    analyser,
    crossfaderSide,
    crossfaderConnection,
  };

  deckGraphs.set(deckId, graph);
  return graph;
}

export function destroyDeckGraph(deckId: DeckId) {
  const graph = deckGraphs.get(deckId);
  if (!graph) return;

  graph.audio.pause();
  graph.audio.removeAttribute('src');
  graph.audio.load(); // Release resources

  try {
    graph.source.disconnect();
    graph.eqLow.disconnect();
    graph.eqMid.disconnect();
    graph.eqHigh.disconnect();
    graph.eqBands.forEach((b) => b.disconnect());
    graph.filterSweep.disconnect();
    graph.deckGain.disconnect();
    graph.analyser.disconnect();
  } catch { /* already disconnected */ }

  deckGraphs.delete(deckId);
}

export function getDeckGraph(deckId: DeckId): DeckGraph | undefined {
  return deckGraphs.get(deckId);
}

// --- EQ Controls ---

export function updateEQ3(deckId: DeckId, low: number, mid: number, high: number) {
  const graph = deckGraphs.get(deckId);
  if (!graph) return;
  graph.eqLow.gain.value = low;
  graph.eqMid.gain.value = mid;
  graph.eqHigh.gain.value = high;
}

export function updateEQBand(deckId: DeckId, index: number, gain: number) {
  const graph = deckGraphs.get(deckId);
  if (!graph || index < 0 || index >= graph.eqBands.length) return;
  graph.eqBands[index].gain.value = gain;
}

export function updateAllEQBands(deckId: DeckId, gains: number[]) {
  const graph = deckGraphs.get(deckId);
  if (!graph) return;
  for (let i = 0; i < Math.min(gains.length, graph.eqBands.length); i++) {
    graph.eqBands[i].gain.value = gains[i];
  }
}

// --- Volume ---

export function updateDeckVolume(deckId: DeckId, volume: number) {
  const graph = deckGraphs.get(deckId);
  if (!graph) return;
  graph.deckGain.gain.value = volume;
}

export function updateMasterVolume(volume: number) {
  if (masterGain) masterGain.gain.value = volume;
}

// --- Crossfader ---

export function updateCrossfader(position: number) {
  if (!crossfaderGainA || !crossfaderGainB) return;
  // Equal-power crossfade
  crossfaderGainA.gain.value = Math.cos(position * Math.PI / 2);
  crossfaderGainB.gain.value = Math.sin(position * Math.PI / 2);
}

export function updateDeckCrossfaderSide(deckId: DeckId, side: 'A' | 'B') {
  const graph = deckGraphs.get(deckId);
  if (!graph || !crossfaderGainA || !crossfaderGainB) return;
  if (graph.crossfaderSide === side) return;

  // Disconnect from current side, connect to new side
  try { graph.analyser.disconnect(graph.crossfaderConnection); } catch { /* ok */ }
  const newConnection = side === 'A' ? crossfaderGainA : crossfaderGainB;
  graph.analyser.connect(newConnection);
  graph.crossfaderSide = side;
  graph.crossfaderConnection = newConnection;
}

// --- Analyser ---

export function getAnalyserLevel(deckId: DeckId): number {
  const graph = deckGraphs.get(deckId);
  if (!graph) return 0;
  const data = new Uint8Array(graph.analyser.frequencyBinCount);
  graph.analyser.getByteTimeDomainData(data);
  // RMS level
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const v = (data[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / data.length);
}

export function getMasterLevel(): number {
  if (!masterAnalyser) return 0;
  const data = new Uint8Array(masterAnalyser.frequencyBinCount);
  masterAnalyser.getByteTimeDomainData(data);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const v = (data[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / data.length);
}

export function getMasterFFTData(): Uint8Array | null {
  if (!masterAnalyser) return null;
  const data = new Uint8Array(masterAnalyser.frequencyBinCount);
  masterAnalyser.getByteFrequencyData(data);
  return data;
}

// --- Filter Sweep (for effects) ---

export function setFilterSweepFrequency(deckId: DeckId, frequency: number) {
  const graph = deckGraphs.get(deckId);
  if (!graph) return;
  graph.filterSweep.frequency.value = Math.max(20, Math.min(20000, frequency));
}

export function resetFilterSweep(deckId: DeckId) {
  const graph = deckGraphs.get(deckId);
  if (!graph) return;
  graph.filterSweep.frequency.value = 20000;
}

// --- Echo Out (smooth gain ramp) ---

export function rampDeckGainTo(deckId: DeckId, targetValue: number, durationSecs: number) {
  const graph = deckGraphs.get(deckId);
  if (!graph || !audioCtx) return;
  graph.deckGain.gain.linearRampToValueAtTime(targetValue, audioCtx.currentTime + durationSecs);
}

export function setDeckGainImmediate(deckId: DeckId, value: number) {
  const graph = deckGraphs.get(deckId);
  if (!graph || !audioCtx) return;
  graph.deckGain.gain.cancelScheduledValues(audioCtx.currentTime);
  graph.deckGain.gain.value = value;
}
