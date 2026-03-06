# RockDaHouse — DJ Console

## Project Overview

Browser-based DJ mixing console that uses YouTube as the audio source. Two decks with crossfader, BPM sync, waveforms, loops, hot cues, and YouTube search — all client-side.

**Tagline:** "Every song on YouTube. Your browser is the DJ booth."

## Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4 + CSS custom properties (dark/light themes)
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
│   ├── Deck.tsx              # Full deck: player + waveform + controls + BPM + loops + cues
│   ├── YouTubePlayer.tsx     # YouTube IFrame embed wrapper
│   ├── Waveform.tsx          # Canvas waveform with loop region + hot cue markers
│   ├── Mixer.tsx             # Crossfader + channel faders + VU + master
│   ├── Crossfader.tsx        # Horizontal slider with equal power curve
│   ├── Fader.tsx             # Reusable vertical/horizontal slider
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
│   ├── MidiStatus.tsx        # MIDI connection indicator + learn panel
│   ├── FXControls.tsx        # Per-deck effects: brake, spinback, beat repeat, echo out, filter sweep
│   ├── Sampler.tsx           # 16-pad sampler with Web Audio API, custom sample upload
│   └── Equalizer.tsx         # Canvas-based rainbow bar equalizer (footer)
├── stores/
│   ├── useDeckStore.ts       # 4 deck instances (A/B/C/D) via factory, loop + hotCues
│   ├── useMixerStore.ts      # Crossfader, master volume, VU levels, deck mode, crossfader assign
│   ├── useSearchStore.ts     # Search query, results, loading
│   ├── usePlaylistStore.ts   # Persistent playlist (localStorage)
│   ├── useMidiStore.ts       # MIDI mappings, learn mode, connection state (persistent)
│   ├── useEffectsStore.ts    # Per-deck effect state + effect runners (brake, spinback, etc.)
│   ├── useSamplerStore.ts    # 16-pad sampler: AudioContext, buffers, trigger/stop, custom upload
│   └── useThemeStore.ts      # Theme (dark/light), persisted, syncs data-theme attribute
├── hooks/
│   ├── useYouTubePlayer.ts   # YouTube IFrame API initialization & control
│   ├── useKeyboardShortcuts.ts # Global keyboard shortcuts
│   ├── useMidi.ts            # Web MIDI API: connect, parse messages, execute actions
│   └── useTapTempo.ts        # BPM calculation from tap intervals
└── lib/
    ├── youtube.ts            # YouTube Data API v3 search client
    ├── types.ts              # TypeScript interfaces
    └── samples.ts            # Synthesized audio samples (kick, snare, hihat, etc.)
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
- [x] BPM tap tempo, VU meters, search, keyboard shortcuts
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
- [x] SVG rotary knobs
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

### P6
- [x] Per-deck effects: Brake, Spinback, Beat Repeat, Echo Out, Filter Sweep
- [x] Effects work within YouTube Player API constraints (setPlaybackRate, setVolume, seekTo)
- [x] 16-pad sampler with Web Audio API (synthesized samples including realistic vinyl scratch)
- [x] Custom sample upload via file input (decodeAudioData)
- [x] Loop mode per sampler pad
- [x] MIDI learn for all FX triggers and sampler pads

### P7
- [x] Skin system: dark + light themes via CSS custom properties + `data-theme` attribute
- [x] Theme toggle button in header, persisted to localStorage
- [x] Anti-flash script in layout.tsx (reads theme before paint)
- [x] Canvas-based rainbow bar equalizer in footer (32 bars, rAF loop)

## Removed Features

### EQ (removed — not functional)
- 3-band EQ knobs (HI/MD/LO) and 8-band EQ panel were removed because they were **visual-only** — YouTube IFrame embeds don't expose the audio stream (CORS), so BiquadFilterNodes can't process the audio.
- Attempted a Web Audio pipeline (server-side audio extraction via ytdl-core → audio proxy → HTMLAudioElement → Web Audio graph), but YouTube blocks datacenter IPs and ytdl-core is archived. InnerTube API also requires poToken auth now.
- **Future alternative:** If a reliable way to extract/proxy YouTube audio is found (e.g. yt-dlp on a dedicated server, or a third-party API), the EQ can be re-implemented with real BiquadFilterNodes. The Knob component still exists (used by Sampler).

## Future Phases

- P4: User auth (Supabase), cloud playlists, share sets by URL
- P8: Recording, set export
- Real EQ: needs a reliable audio extraction method (see "Removed Features" above)

## Monetization Analysis (YouTube API costs)

### API Consumption
- YouTube Data API v3: 10,000 units/day per API key, `search.list` = 100 units/call → **100 searches/day/key**
- Spotify API (BPM lookup): Free, only rate-limited
- YouTube Player embed: Free, unlimited

### Usage Estimates per User Type
| Profile | Searches/session | Sessions/month |
|---------|-----------------|----------------|
| One Nighter (6h+ party) | 150-200 | 1 |
| Basic (regular DJ) | 15-25/day | 20 days |
| Pro (daily DJ) | 30-50/day | 30 days |

### Key Insight: 1 One Nighter ≈ 1 full API key/day
With server-side cache (reduces ~50% repeated queries like "bad bunny"), a party DJ still uses ~100 unique searches = 10,000 units.

### Proposed Plans
| Plan | Price | Searches included | Notes |
|------|-------|-------------------|-------|
| **One Nighter** | $2.99 USD (24h) | 250 | "Less than a drink" — covers 6-8h party |
| **Basic** | $5.99/month | 800 (~27/day) | Practice + 2-3 gigs/month |
| **Pro** | $11.99/month | 3000 (~100/day) | Daily use, basically unlimited |

### Infrastructure Costs
| Service | Monthly |
|---------|---------|
| Vercel Pro | $20 |
| Vercel KV (cache) | $0-5 |
| Domain | ~$1 |
| **Total** | ~$21-26 |

### Break-even: 5 Basic users or 3 Pro users
### Target: 100 Basic ($599) or 50 Pro ($599)

### Prerequisites Before Monetizing
1. **Server-side rate limiting** (current localStorage limit is bypassable)
2. **Search result cache** (Redis/Vercel KV — dedup popular queries)
3. **API key pool rotation** (distribute quota across N keys for peak Saturday nights)
4. **User auth** (P4: Supabase — link plan ↔ user)
