import { useEffect, useCallback } from 'react';
import { useMidiStore, type MidiAction } from '@/stores/useMidiStore';
import { useDeckAStore, useDeckBStore, useDeckCStore, useDeckDStore } from '@/stores/useDeckStore';
import { useMixerStore } from '@/stores/useMixerStore';
import { useEffectsStore, type EffectType } from '@/stores/useEffectsStore';
import { useSamplerStore } from '@/stores/useSamplerStore';
import type { DeckId } from '@/lib/types';

function getDeckStore(deck: string) {
  switch (deck) {
    case 'deckA': return useDeckAStore;
    case 'deckB': return useDeckBStore;
    case 'deckC': return useDeckCStore;
    case 'deckD': return useDeckDStore;
    default: return null;
  }
}

function executeAction(action: MidiAction, value: number) {
  const [deck, control] = action.split('.') as [string, string];
  const mixer = useMixerStore.getState();

  // Global controls
  if (action === 'crossfader') {
    mixer.setCrossfaderPosition(value / 127);
    return;
  }
  if (action === 'masterVolume') {
    mixer.setMasterVolume(value / 127);
    return;
  }

  // Sampler pad triggers
  if (deck === 'sampler') {
    const padNum = parseInt(control.replace('pad', ''), 10);
    if (value > 0 && padNum >= 1 && padNum <= 8) triggerSamplerPad(padNum - 1);
    return;
  }

  const store = getDeckStore(deck);
  if (!store) return;
  const state = store.getState();

  switch (control) {
    case 'play':
      if (value > 0) { // Note on
        if (state.isPlaying) state.playerRef?.pauseVideo();
        else state.playerRef?.playVideo();
      }
      break;
    case 'cue':
      if (value > 0) {
        state.playerRef?.pauseVideo();
        state.playerRef?.seekTo(0, true);
      }
      break;
    case 'volume':
      state.setVolume(value / 127);
      break;
    case 'pitch':
      // MIDI CC 0-127 mapped to -1..+1
      state.setPitchValue((value / 127) * 2 - 1);
      break;
    case 'scratchMode':
      if (value > 0) state.setScratchMode(!state.scratchMode);
      break;
    case 'listen': {
      if (value > 0) {
        const deckIdMap: Record<string, DeckId> = { deckA: 'A', deckB: 'B', deckC: 'C', deckD: 'D' };
        const did = deckIdMap[deck];
        if (did) useMixerStore.getState().toggleCue(did);
      }
      break;
    }
    case 'hotcue1':
      if (value > 0) triggerHotCue(store, 0);
      break;
    case 'hotcue2':
      if (value > 0) triggerHotCue(store, 1);
      break;
    case 'hotcue3':
      if (value > 0) triggerHotCue(store, 2);
      break;
    case 'loop4':
      if (value > 0) toggleBeatLoop(store, 4);
      break;
    case 'loop8':
      if (value > 0) toggleBeatLoop(store, 8);
      break;
    case 'loop16':
      if (value > 0) toggleBeatLoop(store, 16);
      break;
    case 'fxBrake':
      if (value > 0) triggerEffect(deck, 'brake');
      break;
    case 'fxSpin':
      if (value > 0) triggerEffect(deck, 'spinback');
      break;
    case 'fxRepeat':
      if (value > 0) triggerEffect(deck, 'beatRepeat');
      break;
    case 'fxEcho':
      if (value > 0) triggerEffect(deck, 'echoOut');
      break;
    case 'fxFilter':
      if (value > 0) triggerEffect(deck, 'filterSweep');
      break;
  }
}

function triggerEffect(deck: string, effect: EffectType) {
  const deckIdMap: Record<string, DeckId> = { deckA: 'A', deckB: 'B', deckC: 'C', deckD: 'D' };
  const deckId = deckIdMap[deck];
  if (deckId) {
    useEffectsStore.getState().startEffect(deckId, effect);
  }
}

function triggerSamplerPad(padIndex: number) {
  useSamplerStore.getState().triggerPad(padIndex);
}

function triggerHotCue(store: ReturnType<typeof getDeckStore>, index: number) {
  if (!store) return;
  const state = store.getState();
  const cue = state.hotCues[index];
  if (cue) {
    state.playerRef?.seekTo(cue.time, true);
  } else {
    const t = state.playerRef?.getCurrentTime?.() ?? 0;
    const colors = ['#ef4444', '#eab308', '#22c55e'];
    state.setHotCue(index, { time: t, label: `${index + 1}`, color: colors[index] });
  }
}

function toggleBeatLoop(store: ReturnType<typeof getDeckStore>, beats: number) {
  if (!store) return;
  const state = store.getState();
  if (state.loop.active && state.loop.beats === beats) {
    state.clearLoop();
  } else if (state.bpm && state.bpm > 0) {
    const beatDuration = 60 / state.bpm;
    const t = state.playerRef?.getCurrentTime?.() ?? 0;
    state.setLoop({ active: true, start: t, end: t + beatDuration * beats, beats });
  }
}

export function useMidi() {
  const { setConnected, setLastMessage, mappings } = useMidiStore();

  const handleMidiMessage = useCallback((e: WebMidi.MIDIMessageEvent) => {
    const [status, note, value] = e.data;
    const channel = status & 0x0F;
    const msgType = status & 0xF0;

    let type: string;
    if (msgType === 0xB0) type = 'cc';
    else if (msgType === 0x90) type = 'note';
    else if (msgType === 0x80) type = 'note'; // Note off
    else return;

    const effectiveValue = msgType === 0x80 ? 0 : value;

    setLastMessage({ channel, type, note, value: effectiveValue });

    // Find matching mapping and execute
    const currentMappings = useMidiStore.getState().mappings;
    for (const mapping of currentMappings) {
      if (mapping.channel === channel && mapping.note === note && mapping.type === type) {
        executeAction(mapping.action, effectiveValue);
        break;
      }
    }
  }, [setLastMessage]);

  useEffect(() => {
    if (!navigator.requestMIDIAccess) return;

    let inputs: WebMidi.MIDIInput[] = [];

    navigator.requestMIDIAccess().then((access) => {
      const connectInputs = () => {
        // Disconnect old
        inputs.forEach((input) => { input.onmidimessage = null; });
        inputs = [];

        access.inputs.forEach((input) => {
          input.onmidimessage = handleMidiMessage as any;
          inputs.push(input);
        });

        if (inputs.length > 0) {
          setConnected(true, inputs[0].name ?? 'MIDI Device');
        } else {
          setConnected(false);
        }
      };

      connectInputs();
      access.onstatechange = connectInputs;
    }).catch(() => {
      setConnected(false);
    });

    return () => {
      inputs.forEach((input) => { input.onmidimessage = null; });
    };
  }, [handleMidiMessage, setConnected]);
}
