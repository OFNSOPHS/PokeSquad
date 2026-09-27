# CLAUDE.md

Guidance for Claude Code when working in this repo.

## Project

PokéSquad — a browser pack-opening game. Player opens 14 packs (6 type-locked
"Starting Lineup" packs + 8 grab-bag "Bench" packs), picks one of 5 rolled
cards per pack, and builds a 14-card squad. No build step: plain HTML/CSS/JS,
served as static files.

**IMPORTANT — no official Pokémon assets.** Do not use official Nintendo/Game
Freak/Pokémon Company artwork, sprites, logos, or product photography
anywhere in this project (pack art, card art, icons, etc.), even for local/
personal use. All visuals must be original (CSS/SVG gradients, textures,
shapes) or licensed-safe. This has come up before — a user request to use
real scanned booster-pack photos as pack backgrounds was declined for this
reason; that reasoning still applies to any similar future request.

## Running it

```bash
cd pokesquad
python3 -m http.server 8124   # any static server works; port 8124 is just what's in use
```
Open `http://localhost:8124`. `type="module"` scripts don't work over `file://`,
so it must be served over HTTP, not opened directly.

## File structure

```
pokesquad/
├── index.html                   # all markup: header, box panels, sidebar, pack-opening overlay
├── style.css                    # all styling (single file, no preprocessor)
├── scripts/
│   ├── main.js                  # DOM wiring, game state, click handlers, animation sequencing
│   ├── packLogic.js             # pure functions: rarity/type/shiny rolls, scoring — no DOM
│   └── supabaseClient.js        # empty stub — Supabase persistence not yet implemented
├── data/
│   └── pokemon.json             # card pool: [{ id, name, type: [...], rarity }]
└── assets/
    ├── textures/
    │   ├── pack-shape.avif          # source foil-pouch photo (has baked-in checkerboard, not real alpha)
    │   └── pack-shape-clean.png     # cropped/cleaned version actually used in CSS (see below)
    └── packs/                       # reserved for future original starter-pack art (currently unused —
                                      # see "no official Pokémon assets" above for why it's still empty)
```

## Core mechanic

- 6 Starting Lineup packs, each locked to one type: Fire, Water, Grass,
  Electric, Dark, Psychic (fixed set, hardcoded in `index.html` — not
  player-chosen at setup).
- 8 Bench packs: no fixed type, grab-bag pool, worse odds.
- Click a pack → 5 candidate cards are rolled → player flips them (or hits
  Space / "Flip All") → picking an already-flipped card locks it in.
- **Favorite-type crown**: CSS/JS support exists (`is-favorite` class drives
  `starterFavorite` odds tier + crown icon), but there is **no UI yet** to
  actually select a favorite pack. All starters currently roll at the
  `starterNonFavorite` tier. This is a known gap, not a bug.

### Odds (`scripts/packLogic.js`)

| Tier | Common | Uncommon | Rare | Legendary |
|---|---|---|---|---|
| Bench | 60% | 26% | 11% | 3% |
| Starter, non-favorite | 42% | 30% | 20% | 8% |
| Starter, favorite | 20% | 28% | 34% | 18% |

Within a rarity, a starter pack's own type is weighted `TYPE_WEIGHT_MULTIPLIER`
(2.5x) vs off-type entries — biased, not exclusive. Shiny is a flat
independent `SHINY_CHANCE` (1/100) roll on every card, `+2` score bonus.
Scoring: `RARITY_VALUES = { common: 1, uncommon: 2, rare: 3, legendary: 5 }`.

`packLogic.js` is pure (no DOM) — safe to unit test in isolation if that's
ever added.

## Pack-opening animation sequence (`main.js`)

Click a pack → `#openingPack` (a big centered clone reusing `.pack`'s own
CSS, colored/foiled to match whichever pack was clicked) plays in the
full-screen `#revealOverlay`:

1. **Shake** (`is-shaking`, 600ms)
2. **Crack** (`is-cracking`, 250ms) — a glow line appears down the middle
3. **Rip** (`is-ripping`, 500ms) — splits into `.pack__half--top` /
   `.pack__half--bottom`, which fly apart and fade
4. Hands off to the 5-card flip picker (`.reveal-card`, `.reveal-card__inner`
   does the 3D flip); the chosen card fades/scales into the original pack
   slot via `.pack__reveal`

Timing constants (`SHAKE_MS`, `CRACK_MS`, `RIP_MS`, `CHOSEN_HOLD_MS`,
`OVERLAY_FADE_MS`) are all at the top of `main.js`.

## Visual design system

Current look is a **"PC Storage Box" UI** (referencing the classic Pokémon
box-system screen) — flat, muted, modular panels. This replaced an earlier
"red Pokédex device shell" pass that was scrapped entirely (don't resurrect
`.device-shell`/`.device-bezel`/`.device-lens` — they're gone from the CSS).

- **Page bg**: flat muted gray-blue, `var(--page-bg)` (`#2c3140`) — kept
  separate from `--bg` (`#0b0e1a`), which is still the dark navy used as the
  fallback stop in pack/card gradients. Don't merge these two variables.
- **Box panels** (`.box-panel`): "Starting Lineup" and "Bench" are each their
  own module — flat `var(--panel-muted)` fill, thin border, rounded-top
  `.box-panel__tab` header with decorative `‹ ›` arrows. `.box-panel__body`
  carries a localized inset teal glow (`rgba(45,212,191,...)`) around just
  the pack grid — this is intentionally not a page-wide effect.
- **Sidebar** ("Progress"): its own matching panel, `.sidebar__tab` +
  `.sidebar__body`, same visual weight as the box panels.
- **Search bar**: still has the older "retro dialogue box" double-border
  style (`--retro-border`/`--retro-navy`, `border` + `outline` +
  `outline-offset` for the thin-line/gap/thick-line effect) from a prior
  pixel-art pass. It was deliberately left alone when the PC Box redesign
  happened — it now looks slightly different in tone from the muted panels.
  Ask before "fixing" this; it may be intentional or may just not have come
  up yet.
- **Fonts**: three-tier system, all Google Fonts.
  - `--font-pixel` ("Press Start 2P") — page chrome only: logo, section/tab
    titles, sidebar, buttons, control hints.
  - `--font-display` ("Baloo 2") — pack-facing text: type labels, bench
    label, revealed card/result names. Deliberately **not** pixel font —
    Press Start 2P is unreadable at Pokémon-name lengths.
  - `--font-body` ("Inter") — everything else (search input, hint labels).
- **Type colors**: `--type-<name>` / `--type-<name>-dark` in `:root` are the
  Bulbapedia/Veekun standard hex values (not made up) — e.g. Dark type is
  genuinely brown (`#705848`), not purple, per the real games. If asked to
  "fix" a type color because it looks wrong, check Bulbapedia before
  changing it — brown Dark is correct, not a bug.
- **Pack shape/foil**: `.pack__art` (type-color gradient) +
  `.pack__foil` (background-image: `assets/textures/pack-shape-clean.png`,
  `mix-blend-mode: multiply`) layered on top. The foil texture is a real
  product photo of a plain white foil pouch — the checkerboard
  "transparency" baked into the original `pack-shape.avif` was manually
  detected/stripped (see git history / conversation for the detection
  approach) to produce `pack-shape-clean.png`, which is what's actually
  referenced in CSS. If this file is ever regenerated from the `.avif`
  source, redo that cleanup — don't wire the raw `.avif` directly into CSS.
- **Bench packs**: separate "mystery/holo" treatment — 5-stop pastel
  prismatic gradient (`.pack--bench .pack__art`), scattered SVG sparkle
  accents, and a `.pack__mystery-icon` (deliberately *not* a real Poké Ball —
  it's an original two-tone "capture orb" silhouette, generic circle+band+
  center-dot, not Nintendo's red/white color scheme).

## Known gaps / not yet built

- Favorite-type pack selection UI (crown/odds-tier logic exists, nothing
  triggers it).
- Search bar (`#cardSearch`) is visual only — no filtering logic wired up.
- `scripts/supabaseClient.js` is an empty stub. Login/leaderboard/persistence
  from the original project README concept isn't implemented.
- No test suite.

## Testing changes

There's no headless browser tooling installed in this repo by default. When
verifying CSS/animation/interaction changes, actually render the page (e.g.
spin up a temporary Playwright instance pointed at the local server) rather
than reasoning from the CSS alone — this project's history includes multiple
cases where code that looked correct on paper had real rendering bugs (an
inline `<span>` silently collapsing a flip-card to zero size, disabled-button
text going invisible, a gradient whose dark end blended into the page
background) that were only caught by actually looking at rendered output.
