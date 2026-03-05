# RockDaHouse — DJ Console MVP

## Project Overview

Browser-based DJ mixing console that uses YouTube as the audio source. Two decks with crossfader, EQ, BPM tap tempo, VU meters, and YouTube search — all client-side.

**Tagline:** "Every song on YouTube. Your browser is the DJ booth."

## Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4 + CSS custom properties (dark theme)
- **Audio:** YouTube Player API (`player.setVolume()` for MVP — no Web Audio routing yet)
- **State:** Zustand (separate stores for deck A, deck B, mixer, search)
- **Deploy:** Vercel (auto-deploy from `main` branch)
- **Repo:** github.com/Soysebalopez/rockdahouse

## Architecture

```
src/
├── app/
│   ├── layout.tsx          # Root layout, metadata, dark theme
│   ├── page.tsx            # Single page app — renders Console
│   └── globals.css         # Tailwind + CSS custom properties (design tokens)
├── components/
│   ├── Console.tsx         # Main layout: header + decks + mixer + search
│   ├── Deck.tsx            # Full deck: player + controls + EQ + BPM
│   ├── YouTubePlayer.tsx   # YouTube IFrame embed wrapper
│   ├── Mixer.tsx           # Crossfader + channel faders + VU + master
│   ├── Crossfader.tsx      # Horizontal slider with equal power curve
│   ├── Fader.tsx           # Reusable vertical/horizontal slider
│   ├── EQControls.tsx      # 3-band EQ (visual only for MVP)
│   ├── VUMeter.tsx         # Canvas-based animated level meter
│   ├── TransportControls.tsx # Play/Pause/Stop
│   ├── BPMDisplay.tsx      # BPM number + TAP button
│   ├── TrackInfo.tsx       # Title + channel + seek bar + time
│   ├── SearchPanel.tsx     # YouTube search with debounce
│   └── SearchResult.tsx    # Single result with load-to-deck buttons
├── stores/
│   ├── useDeckStore.ts     # Per-deck state (2 instances: A and B)
│   ├── useMixerStore.ts    # Crossfader, master volume, VU levels
│   └── useSearchStore.ts   # Search query, results, loading
├── hooks/
│   ├── useYouTubePlayer.ts # YouTube IFrame API initialization & control
│   ├── useKeyboardShortcuts.ts # Global keyboard shortcuts
│   └── useTapTempo.ts      # BPM calculation from tap intervals
└── lib/
    ├── youtube.ts          # YouTube Data API v3 search client
    └── types.ts            # TypeScript interfaces
```

## Design System

- **Theme:** Dark only. All backgrounds use CSS custom properties (--bg-primary: #0a0a0f, --bg-surface: #151520, --bg-elevated: #1e1e2e)
- **Deck A accent:** Pink (#ec4899)
- **Deck B accent:** Blue (#3b82f6)
- **VU meter colors:** Green → Yellow → Red
- **No light theme elements ever**

## Audio Approach (MVP)

YouTube IFrame + `player.setVolume()` API. Crossfader uses equal power curve:
- `gainA = cos(position * π/2) * deckVolume * masterVolume`
- `gainB = sin(position * π/2) * deckVolume * masterVolume`

EQ controls are visual-only for MVP (no Web Audio routing due to CORS on YouTube iframes).

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play/Pause Deck A |
| Enter | Play/Pause Deck B |
| ← / → | Move crossfader |
| ↑ / ↓ | Master volume |
| S | Toggle search panel |
| Q/A/Z | EQ kill Hi/Mid/Lo Deck A |
| E/D/C | EQ kill Hi/Mid/Lo Deck B |

## Environment Variables

- `NEXT_PUBLIC_YOUTUBE_API_KEY` — YouTube Data API v3 key (set in Vercel + .env.local)

## Development

```bash
npm run dev    # Local dev
npm run build  # Production build
npm run lint   # ESLint
```

## MVP Status

- [x] T01 — Project setup + dark theme
- [x] T02 — YouTube player component
- [x] T03 — Console layout + Deck component
- [x] T04 — Transport controls
- [x] T05 — Fader component
- [x] T06 — Volume control
- [x] T07 — Zustand stores
- [x] T08 — Crossfader + logic
- [x] T09 — Mixer layout
- [x] T10 — EQ controls (visual)
- [x] T11 — BPM display + tap tempo
- [x] T12 — VU meters (simulated)
- [x] T13 — YouTube search
- [x] T14 — Keyboard shortcuts
- [x] T15 — TrackInfo display
- [x] T16 — Responsive layout
- [ ] T17 — Deploy + testing

## Post-MVP Phases

- P2: Auto BPM detection, beat sync, loops, hot cues, effects
- P3: Colored waveforms, jog wheels, animations
- P4: User auth (Supabase), cloud playlists
- P5: MIDI support, recording, 4 decks
