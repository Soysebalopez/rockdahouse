# RockDaHouse — DJ Console

## Project Overview

Browser-based DJ mixing console that uses YouTube as the audio source. Two decks with crossfader, EQ, BPM sync, waveforms, loops, hot cues, and YouTube search — all client-side.

**Tagline:** "Every song on YouTube. Your browser is the DJ booth."

## Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4 + CSS custom properties (dark theme)
- **Audio:** YouTube Player API (`player.setVolume()` + `setPlaybackRate()`)
- **BPM:** Spotify API (server-side via `/api/bpm`) + tap tempo fallback
- **State:** Zustand (deck A, deck B, mixer, search, playlist stores)
- **Persistence:** zustand/persist → localStorage (playlist)
- **Deploy:** Vercel (auto-deploy from `main` branch)
- **Repo:** github.com/Soysebalopez/rockdahouse

## Architecture

```
src/
├── app/
│   ├── layout.tsx            # Root layout, metadata, dark theme
│   ├── page.tsx              # Single page app — renders Console
│   ├── globals.css           # Tailwind + CSS custom properties (design tokens)
│   └── api/bpm/route.ts      # Spotify BPM lookup (server-side, caches token)
├── components/
│   ├── Console.tsx           # Main layout: header + decks + sync + mixer + search + playlist
│   ├── Deck.tsx              # Full deck: player + waveform + controls + EQ + BPM + loops + cues
│   ├── YouTubePlayer.tsx     # YouTube IFrame embed wrapper
│   ├── Waveform.tsx          # Canvas waveform with loop region + hot cue markers
│   ├── Mixer.tsx             # Crossfader + channel faders + VU + master
│   ├── Crossfader.tsx        # Horizontal slider with equal power curve
│   ├── Fader.tsx             # Reusable vertical/horizontal slider
│   ├── EQControls.tsx        # 3-band EQ (visual only — no Web Audio due to CORS)
│   ├── VUMeter.tsx           # Canvas-based animated level meter (simulated)
│   ├── TransportControls.tsx # Play/Pause/Stop
│   ├── BPMDisplay.tsx        # Auto BPM (Spotify) + TAP tempo, source indicator
│   ├── BPMSync.tsx           # Sync button + nudge ±1% + BPM diff indicator
│   ├── CueControls.tsx       # Pre-listen: CUE A/B buttons + CUE↔MASTER mix knob
│   ├── LoopControls.tsx      # 4/8/16 beat loops + manual IN/OUT
│   ├── HotCues.tsx           # 3 color-coded cue points per deck
│   ├── TrackInfo.tsx         # Title + channel + seek bar + time
│   ├── SearchPanel.tsx       # YouTube search with debounce
│   ├── SearchResult.tsx      # Result with + (playlist) and → A/B/C/D buttons
│   ├── Playlist.tsx          # Persistent playlist with drag-to-reorder
│   └── MidiStatus.tsx        # MIDI connection indicator + learn panel
├── stores/
│   ├── useDeckStore.ts       # 4 deck instances (A/B/C/D) via factory, loop + hotCues
│   ├── useMixerStore.ts      # Crossfader, master volume, VU levels, deck mode, crossfader assign
│   ├── useSearchStore.ts     # Search query, results, loading
│   ├── usePlaylistStore.ts   # Persistent playlist (localStorage)
│   └── useMidiStore.ts       # MIDI mappings, learn mode, connection state (persistent)
├── hooks/
│   ├── useYouTubePlayer.ts   # YouTube IFrame API initialization & control
│   ├── useKeyboardShortcuts.ts # Global keyboard shortcuts
│   ├── useMidi.ts            # Web MIDI API: connect, parse messages, execute actions
│   └── useTapTempo.ts        # BPM calculation from tap intervals
└── lib/
    ├── youtube.ts            # YouTube Data API v3 search client
    └── types.ts              # TypeScript interfaces
```

## Key Technical Decisions

- **Volume routing:** Console.tsx runs a rAF loop that reads all state via `getState()` and applies effective volume (`deckVol * crossfaderGain * masterVol`) to each YouTube player. This avoids re-render storms.
- **Loop enforcement:** Deck.tsx polls `getCurrentTime()` at 50ms and calls `seekTo(loopStart)` when past `loopEnd`. Not sample-accurate but good enough for YouTube.
- **BPM sync:** Uses `player.setPlaybackRate()` which changes pitch (no time-stretching). Best for small adjustments (<5% difference).
- **Waveform:** Deterministic PRNG seeded by videoId — not real audio data but visually consistent per track.
- **CUE system:** Overrides volume routing to solo one deck for preview. Uses interval-based polling separate from the main rAF loop.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play/Pause Deck A |
| Enter | Play/Pause Deck B |
| ← / → | Move crossfader |
| ↑ / ↓ | Master volume |
| S | Toggle search panel |
| P | Toggle playlist |
| Q/A/Z | EQ kill Hi/Mid/Lo Deck A |
| E/D/C | EQ kill Hi/Mid/Lo Deck B |

## Environment Variables

- `NEXT_PUBLIC_YOUTUBE_API_KEY` — YouTube Data API v3 key
- `SPOTIFY_CLIENT_ID` — Spotify app client ID (for BPM lookup)
- `SPOTIFY_CLIENT_SECRET` — Spotify app client secret (server-side only)

## Development

```bash
npm run dev    # Local dev
npm run build  # Production build
npm run lint   # ESLint
```

## Completed

### MVP (P0+P1)
- [x] Dual YouTube decks, crossfader, volume faders, master
- [x] EQ 3-band visual, BPM tap tempo, VU meters, search, keyboard shortcuts
- [x] Dark theme, responsive layout, Vercel deploy

### P2
- [x] Waveform display (simulated, seeded by videoId)
- [x] BPM auto-detection via Spotify API
- [x] BPM sync (setPlaybackRate) + nudge controls
- [x] CUE pre-listen system
- [x] Loops (4/8/16 beats + manual IN/OUT)
- [x] Hot cues (3 per deck, color-coded)
- [x] Playlist with drag-to-reorder (persistent)
- [x] UI polish (transitions, hover states, focus rings)

### P3
- [x] Canvas jog wheels (spinning vinyl + scratch drag)
- [x] SVG rotary knobs for EQ controls
- [x] Gradient backgrounds, glow on playing decks
- [x] LIVE badge animation

### P5
- [x] Web MIDI API integration with MIDI learn mode
- [x] Persistent MIDI mappings (localStorage)
- [x] MidiStatus indicator + learn panel
- [x] 4-deck mode toggle (2/4 decks)
- [x] Decks C (green) and D (orange) with full feature parity
- [x] Crossfader assign per deck (A-side or B-side routing)
- [x] Mixer expanded to N-channel with per-deck VU meters
- [x] Search/playlist show C/D load buttons in 4-deck mode

## Future Phases

- P4: User auth (Supabase), cloud playlists, share sets by URL
- P6: Recording, effects (filter, reverb), sampler
