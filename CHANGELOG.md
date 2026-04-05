# Changelog

All notable changes to the NovaMed prototype suite.

## [2026-04-05] — Design QA pass + demo rebuilds

### Core Library (`novamed-core/`)
- **Fixed**: Removed hardcoded `Segoe UI` font from `.f-tag` in `components.css` — now uses `var(--font)` (Noto Sans)
- **Fixed**: Removed hardcoded `Segoe UI` font from `.billing-tag` in `billing.js` — now uses `var(--font)`
- **Changed**: `base.css` updated with improved transitions and layout refinements
- **Added**: `tour.js` — event-driven step controller for walkthrough-style demos (Next/Back, autoplay toggle)

### Ambient Voice (`novamed-demos/ambient-voice/`)
- **Rebuilt**: Complete rebuild to use shared `.editor` card pattern (was using standalone `.voice-panel`)
- **Fixed**: Added `overflow: hidden` to `.transcript-area` so chips stay inside field boundaries
- **Fixed**: Voice status transition bumped from 200ms to 500ms (meets animation timing standard)
- **Fixed**: Suggestion button transition bumped from 200ms to 300ms
- **Fixed**: Flash-yellow badge animation bumped from 300ms to 500ms
- **Changed**: Voice header now uses `.voice-mic-btn` + `.voice-waveform` (matches active-dictation)
- **Changed**: Scenes rewritten to use shared `NovaMed.Chips.buildAIChipsFromText()`

### Billing Codes (`novamed-demos/billing-codes/`)
- **Rebuilt**: Scenes rewritten with proper `caption` properties (fixes step navigation)
- **Fixed**: STAGGER constant corrected from 150ms to 120ms (matches design spec)
- **Fixed**: Billing section now has `width: 100%`, `box-sizing: border-box`, `min-height: 200px`

### Not Included
- **Full Walkthrough** (`novamed-demos/full-walkthrough/`) — excluded from this update, needs further polish
