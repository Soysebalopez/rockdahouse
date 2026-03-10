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
│   ├── api/bpm/route.ts       # Spotify BPM lookup (server-side, caches token)
│   ├── api/bpm-batch/route.ts # Batch BPM lookup for search results (Spotify)
│   └── api/video-details/route.ts # Batch video quality lookup (YouTube videos.list)
├── components/
│   ├── Console.tsx           # Main layout: [Deck A] [Center: waveform+sync+mixer] [Deck B] + search + playlist
│   ├── Deck.tsx              # Full deck: player + waveform + controls + BPM + loops/cues/FX (single row)
│   ├── YouTubePlayer.tsx     # YouTube IFrame embed wrapper
│   ├── Waveform.tsx          # Canvas waveform with loop region + hot cue markers
│   ├── DualWaveform.tsx      # Mirrored dual waveform overlay (A top, B bottom) with beat grid
│   ├── Mixer.tsx             # Crossfader + channel faders + VU + CUE buttons + master
│   ├── Crossfader.tsx        # Horizontal slider with equal power curve
│   ├── Fader.tsx             # Reusable vertical/horizontal slider
│   ├── VUMeter.tsx           # Canvas-based animated level meter (simulated)
│   ├── TransportControls.tsx # Play/Pause/Stop
│   ├── BPMDisplay.tsx        # Auto BPM (Spotify) + TAP tempo + effective BPM display
│   ├── BPMSync.tsx           # Sync buttons + sync lock + nudge + effective BPM diff
│   ├── CueControls.tsx       # Pre-listen: CUE buttons for all 4 decks + CUE↔MASTER knob
│   ├── PitchFader.tsx        # Per-deck vertical pitch fader (±8%/±16% range toggle)
│   ├── AudioSettings.tsx     # Audio output config modal (device routing, channel mode)
│   ├── LoopControls.tsx      # 4/8/16 beat loops + manual IN/OUT
│   ├── HotCues.tsx           # 3 color-coded cue points per deck
│   ├── TrackInfo.tsx         # Title + channel + seek bar + time
│   ├── SearchPanel.tsx       # YouTube search with debounce + quality filter + metadata fetch
│   ├── SearchResult.tsx      # Result with BPM/quality badges + playlist/deck buttons
│   ├── Playlist.tsx          # Persistent playlist with drag-to-reorder
│   ├── MidiStatus.tsx        # MIDI connection indicator + learn panel
│   ├── FXControls.tsx        # Per-deck effects: brake, spinback, beat repeat, echo out, filter sweep
│   ├── Sampler.tsx           # 16-pad sampler with Web Audio API, custom sample upload
│   └── Equalizer.tsx         # Canvas-based rainbow bar equalizer (footer)
├── stores/
│   ├── useDeckStore.ts       # 4 deck instances (A/B/C/D) via factory, loop + hotCues + playbackRate + syncLock + pitch + scratchMode
│   ├── useMixerStore.ts      # Crossfader, master volume, VU levels, deck mode, crossfader assign, CUE targets
│   ├── useAudioConfigStore.ts # Audio output device routing (master/headphone device, channel mode)
│   ├── useSearchStore.ts     # Search query, results, loading, quality filter, metadata
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
    ├── waveform.ts           # Shared deterministic waveform data generator (PRNG)
    ├── spotify.ts            # Shared Spotify token management (server-side)
    └── samples.ts            # Synthesized audio samples (kick, snare, hihat, etc.)
```

## Key Technical Decisions

- **Volume routing:** Console.tsx runs a rAF loop that reads all state via `getState()` and applies effective volume (`deckVol * crossfaderGain * masterVol`) to each YouTube player. This avoids re-render storms.
- **Loop enforcement:** Deck.tsx polls `getCurrentTime()` at 50ms and calls `seekTo(loopStart)` when past `loopEnd`. Not sample-accurate but good enough for YouTube.
- **BPM sync:** Uses `player.setPlaybackRate()` which changes pitch (no time-stretching). YouTube only supports specific rates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]. Pitch fader snaps to these values. Sync lock continuously enforces the target rate via the Console.tsx rAF loop.
- **Waveform:** Deterministic PRNG seeded by videoId — not real audio data but visually consistent per track.
- **Dual waveform:** DualWaveform.tsx uses its own rAF loop reading deck stores via `getState()` — renders both decks mirrored (A top, B bottom) with beat grid lines at `60/bpm` intervals.
- **CUE system:** Single volume authority — Console.tsx rAF loop is the ONLY place that calls `player.setVolume()`. CUE targets stored in mixer store, volume blended in the same loop.
- **Audio routing limitation:** `setSinkId()` works on AudioContext (sampler) but NOT on YouTube iframes. CUE system is volume-based simulation.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play/Pause Deck A |
| Enter | Play/Pause Deck B |
| ← / → | Move crossfader |
| ↑ / ↓ | Master volume |
| S | Toggle search panel |
| P | Toggle playlist |
| 1/2/3/4 | Toggle CUE/Listen for Deck A/B/C/D |

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

### P8
- [x] Dual waveform overlay (DualWaveform.tsx): overlapped canvas (A from bottom, B from top) with glow playheads, hot cue markers, track titles
- [x] Beat grid visualization on dual waveform (1.5px lines at BPM intervals, 25% opacity)
- [x] Effective BPM display on dual waveform labels (accounts for playback rate)
- [x] HiDPI canvas rendering (devicePixelRatio scaling)
- [x] Pitch fader per deck: horizontal slider snapping to YouTube-supported rates [0.25..2]
- [x] Effective BPM calculation: `originalBPM × playbackRate` shown in BPMDisplay and BPMSync
- [x] Sync lock toggle: continuous BPM sync enforcement via Console.tsx rAF loop
- [x] Enhanced BPMSync.tsx: sync lock buttons, effective BPM diff, rate step nudge
- [x] Batch BPM detection in search results via `/api/bpm-batch` (Spotify, parallel)
- [x] Video quality detection in search results via `/api/video-details` (YouTube videos.list, 1 unit)
- [x] BPM + HD/SD badges on SearchResult.tsx (inline pills with color coding)
- [x] Quality filter (ALL/HD/SD) in SearchPanel.tsx with result count
- [x] Shared `waveform.ts` utility (extracted from Waveform.tsx for reuse in DualWaveform)
- [x] Shared `spotify.ts` utility (extracted token management from api/bpm/route.ts)
- [x] `playbackRate` and `syncLocked` state added to deck store (reset on track load)
- [x] Tap tempo UX: tap flash animation, tap count badge, reset button, "tap again" hint
- [x] Tap tempo keeps last BPM on timeout (no silent reset), exposed tapCount
- [x] Sync contextual help: shows "TAP BPM on Deck X" when BPM missing, "Load tracks" when empty
- [x] Sync buttons larger (px-3 py-1.5), LOCK buttons with glow, disabled when no BPM
- [x] BPM/quality badges always visible in search: loading shimmer, "N/A" fallback
- [x] Compact deck layout: smaller YouTube player (120px max), smaller jog wheel (90px), tighter gaps
- [x] Compact console layout: reduced padding/gaps so search panel visible without scrolling
- [x] FX + Loop + HotCues merged into single row per deck (shorter decks)
- [x] Horizontal DJ layout: `[Deck A] [Center Controls] [Deck B]` 3-column grid on desktop
- [x] Center column: DualWaveform + BPMSync + CueControls + Mixer stacked vertically
- [x] 4-deck mode: A/B with center controls top row, C/D on second row
- [x] BPM batch API graceful fallback when Spotify credentials missing (returns null instead of 500)
- [x] BPM badges properly resolve to "N/A" when metadata fetch fails (no infinite loading)

### P9
- [x] Per-deck vertical pitch fader (±8%/±16% range toggle, double-click reset)
- [x] Scratch / pitch-bend mode toggle per jog wheel
- [x] CUE/Listen buttons in mixer channel strips (all 4 decks)
- [x] Multi-deck CUE pre-listen (store-driven, 4-deck support)
- [x] Single volume authority — Console.tsx rAF loop is sole `setVolume()` caller (no more flicker)
- [x] Audio output configuration modal (device routing, channel mode, setSinkId for sampler)
- [x] MIDI actions: pitch, scratchMode, listen
- [x] Keyboard shortcuts: 1/2/3/4 for CUE toggles

## Removed Features

### EQ (removed — not functional)
- 3-band EQ knobs (HI/MD/LO) and 8-band EQ panel were removed because they were **visual-only** — YouTube IFrame embeds don't expose the audio stream (CORS), so BiquadFilterNodes can't process the audio.
- Attempted a Web Audio pipeline (server-side audio extraction via ytdl-core → audio proxy → HTMLAudioElement → Web Audio graph), but YouTube blocks datacenter IPs and ytdl-core is archived. InnerTube API also requires poToken auth now.
- **Future alternative:** If a reliable way to extract/proxy YouTube audio is found (e.g. yt-dlp on a dedicated server, or a third-party API), the EQ can be re-implemented with real BiquadFilterNodes. The Knob component still exists (used by Sampler).

## Future Phases

- P4: User auth (Supabase), cloud playlists, share sets by URL
- P10: Recording, set export
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
