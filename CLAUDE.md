# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static website of educational mini-games for kids, in Spanish (es-MX). Five
categories — **Programación** (9 games), **Matemáticas** (9 games),
**Ciberseguridad** (9 games, ethical/defensive: passwords, phishing, privacy,
secret codes), **Español** (9 games: spelling, accents, synonyms, grammar) and
**Geografía** (9 games: flags, capitals, continents, languages, monuments).
Pure vanilla JS using native ES modules; **no build step, no framework, no
package manager, no dependencies**. Everything is shipped as-is.

## Running locally

ES modules and the `fetch`-based module loader require an HTTP origin — opening
files via `file://` will break the imports. Serve the repo root with any static
server, e.g.:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

There are no tests, linters, or build commands.

## Architecture

Three navigation tiers, each a plain HTML page:

- `index.html` — main menu, links to the five category hubs.
- `matematicas.html` / `programacion.html` / `ciberseguridad.html` / `espanol.html` / `geografia.html` — category hubs. Each hardcodes a
  grid of `.game-card`s linking into `games/<id>/index.html`, and a bottom
  inline `<script type="module">` that reads `getStars()` for each game id and
  renders its `★`/`☆` rating.
- `games/<game-id>/` — one folder per game, always three files:
  - `index.html` — minimal shell: loads `../../style.css` then local `style.css`,
    has `<canvas id="confetti-canvas">` + `<div id="app">`, and
    `<script type="module" src="game.js">`.
  - `style.css` — game-specific styles only.
  - `game.js` — the entire game, an ES module that renders into `#app`.

### Shared modules (`shared/`)

All games import from these two — never reimplement their concerns:

- `shared/engine.js` — feedback/effects toolkit: `showConfetti()`, `playTone()`,
  `playSuccess()` / `playError()` / `playClick()` (Web Audio, single shared
  context), `speak(text)` (Spanish TTS via `speechSynthesis`, lang `es-MX`),
  `showToast(text, ms)`.
- `shared/progress.js` — persistence: `saveStars(gameId, stars)` and
  `getStars(gameId)`, backed by `localStorage` under the key `stars-<gameId>`.
  Stars are clamped 0–3. Also `clearStars(gameIds)` (reset a section's games)
  and `clearAllStars()` (reset every `stars-*` key) — used by the "Borrar
  estrellas" buttons on the hubs and the main menu.

### Game conventions (`game.js`)

Every game follows the same shape — match it when adding or editing games:

- First lines import from `../../shared/engine.js` and `../../shared/progress.js`.
- A `const GAME_ID = '<folder-name>'` matching the folder name **and** the
  `stars-<id>` element id on the hub page.
- A `LEVELS` array of config objects (e.g. `{ label, ..., questions }`) driving
  progressive difficulty; the module-scope state (`level`, `score`, `earned`,
  etc.) advances through it.
- The game renders by assigning a template literal to `document.getElementById('app').innerHTML`,
  then re-attaching event listeners after each render (no virtual DOM).
- Scoring rule used across games: percent correct ≥ 0.85 → 3 stars, ≥ 0.6 →
  2 stars, else 1; only save when the new score beats the stored `earned`.
- Feedback pattern on each answer: visual class (`correct`/`wrong`) + sound +
  `speak()`, short `delay()`, then advance; `showConfetti()` + `playSuccess()`
  on level completion.
- The module self-starts by calling its `build()` (or equivalent) at the bottom.

### Styling

`style.css` (root) defines the global design system: CSS custom properties
(`--bg`, `--card`, `--teal`, `--orange`, `--radius`, `--font`, etc.), the `.btn`
variants (`.btn-primary`, `.btn-warn`, `.btn-back`, …), `.toast`, `.speak-btn`,
`#confetti-canvas`, and shared keyframes/anim classes (`bounce`, `shake`, `pop`,
`fadeIn`). Reuse these tokens and classes; put only per-game layout in the
game's local `style.css`.

## Adding a new game

1. Create `games/<id>/` with the three-file shell (copy an existing game).
2. Set `GAME_ID = '<id>'` and build the `LEVELS`/render/check loop following the
   conventions above.
3. Add a `.game-card` to the relevant hub page (`matematicas.html`,
   `programacion.html`, `ciberseguridad.html`, `espanol.html` or
   `geografia.html`) linking to it, with a `stars-<id>` element, and append
   `<id>` to that page's inline stars-rendering array.
4. Update the game count shown on `index.html` if it changed.

## Language

All user-facing text is Spanish (es-MX), including TTS. Keep new copy in Spanish.
