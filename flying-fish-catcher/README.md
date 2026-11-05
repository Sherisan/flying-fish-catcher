# Flying Fish Catcher

A crash-style betting game drawn entirely on an HTML canvas. A trawler crew harpoons and reels in flying fish while the multiplier climbs. At a random point the crane drops a sea mine under the boat, it explodes, every fish flees, and any bet still riding is lost.

Plain HTML, CSS and JavaScript. No build step, no frameworks, no image or audio files. Every creature, the ship, the crew and the sound effects are generated in code.

Play credits only. No real money.

---

## Run it

**Option 1: just open it.** Double-click `index.html`. Everything works offline except the two Google Fonts (it falls back to system fonts).

**Option 2: VS Code Live Server (recommended while editing).**
1. Open this folder in VS Code (`File → Open Folder…`).
2. Install the recommended extension **Live Server** (VS Code will prompt you, or search `ritwickdey.LiveServer`).
3. Right-click `index.html` → **Open with Live Server**. The page reloads every time you save.

**Option 3: npm.** If you have Node.js installed:
```bash
npm start
```
This serves the folder at http://localhost:5500 and opens your browser.

**Debugging in VS Code:** press `F5` and pick **Open game in Chrome**. You can set breakpoints in any `js/` file.

---

## Folder structure

```
flying-fish-catcher/
├── index.html            Page markup: header, bets rail, game stage, HUD, bet slips
├── css/styles.css        All styling. Colour tokens are in :root at the top
├── assets/favicon.svg    Logo / browser tab icon
├── js/
│   ├── 01-setup.js       DOM references, tuning constants, colour themes, shared state, ship geometry
│   ├── 02-draw-helpers.js  Canvas helpers (rr, circle, poly, lin, glow, additive…)
│   ├── 03-creatures.js   Fish / shark / whale renderer and every species design, other animals, field guide data
│   ├── 04-world.js       Simulation: waves, boat, harpoon aiming, rod, fish, sharks, dolphins, orcas, whales, mine, explosion, particles
│   ├── 05-scenery.js     Sky themes, sun, moon, aurora, clouds, islands, lighthouse, underwater, seabed, coral
│   ├── 06-crew.js        Fishermen outfits, faces, moods, arm IK
│   ├── 07-ship.js        The trawler, crane, sea mine artwork, cannon, lights, harpoon and fishing line
│   ├── 08-render.js      render(): layers everything for one frame, explosion visuals
│   ├── 09-game.js        Rounds, betting, cash-out, auto bet, bots, side panels, HUD text
│   ├── 10-audio.js       Synthesised sound effects (Web Audio API)
│   └── 11-main.js        Game loop, saving, event wiring, start()
├── .vscode/              Recommended extensions, launch config, settings
└── package.json          `npm start` local server
```

The scripts are classic `<script>` tags that share one global scope, so **they must load in the numbered order** (already set in `index.html`). A function in a later file can be called from an earlier file at runtime, but top-level code only sees what was loaded before it.

---

## Where to change things

| You want to change… | Look in | Name |
|---|---|---|
| How fast the multiplier climbs | `js/01-setup.js` | `RATE` (multiplier = e^(RATE × seconds)) |
| Betting time between rounds | `js/01-setup.js` | `WAIT` |
| Starting balance | `js/01-setup.js` | `START_BAL` |
| Where the mine goes off (crash point) | `js/01-setup.js` | `genCrash()` (about 3% house edge, about 4% instant mines) |
| Milestone events (sharks 2×, dolphins 3×, whale 4×, orcas 6×…) | `js/01-setup.js` | `MILESTONES` |
| Sky colour schemes | `js/01-setup.js` | `THEME_RAW` (four themes: sunset, tropical, aurora, dawn) |
| Fish sizes, jump heights, speeds | `js/03-creatures.js` | `KINDS` |
| Which fish appear at which multiplier | `js/03-creatures.js` | `pickKind(m)` |
| A species' shape, colours, fins | `js/03-creatures.js` | `D.flyer`, `D.tuna`, `D.mahi`, `D.sail`, `D.snapper`, `D.shark`, `D.tiger`, `D.whale`, `D.dolphin`, `D.orca` |
| Flying fish colours | `js/03-creatures.js` | `PALS`, `GOLD` |
| Crew clothes and skin colours | `js/06-crew.js` | `KITS` |
| Ship shape and details | `js/07-ship.js` | `hullPath()`, `drawHull()`, `drawSuperstructure()`, `drawCrane()`, `drawMine()` |
| Explosion behaviour | `js/04-world.js` | `explode()`, `updateMine()` |
| Explosion visuals | `js/08-render.js` | `drawBlast()`, `drawPlume()` |
| Harpoon accuracy and fire rate | `js/04-world.js` | `updateGun()` (`missOff` chance, reload timers in `updateArrow()`) |
| Sounds | `js/10-audio.js` | `sfx` |
| Bot player names | `js/01-setup.js` | `NICKS` |
| Colours of the interface | `css/styles.css` | `:root` tokens |

---

## How the drawing works

**Coordinates.** The canvas uses CSS pixels. `waterY` is the sea surface, `deepY` is where the mine detonates. Two scale factors keep everything proportional on any screen: `S` for the ship and `FS` for creatures (`resize()` in `04-world.js`).

**The ship** is drawn in its own local units: the waterline is `y = 0`, the bow points to negative `x`, and up is negative `y`. `drawShip()` translates and rotates to the boat, then scales by `S`. `toWorld(x, y)` converts a ship-local point to canvas pixels (used for the harpoon muzzle, the crate and the mine).

**Creatures** use a spine renderer (`fishGeneric()` in `03-creatures.js`):
- `spine()` makes 15 points along the body that wave over time, so bodies bend as they swim.
- `P` is the width profile: a list of `[t, top, bottom]` where `t` runs 0 (tail) to 1 (nose) and the widths are fractions of body length.
- `fin()`, `ridge()` and `sideFin()` attach fins to the body edge at a given `t`.
- Each species object has `grad` (body colours), `tail`, `eye`, and optional `back()`, `pattern()` and `front()` functions for extra detail.
- Local coordinates: the head faces `+x` and the belly is `+y`. `drawOriented()` rotates the creature to its velocity and flips it when swimming left.

**Rounds** (`09-game.js`): `toWaiting()` opens betting, `startRound()` picks a crash point, `crash()` settles bets and calls `dropMine()`. `update()` in `11-main.js` drives everything once per frame.

---

## Developer helpers

When the game runs from a file or from `localhost`, a helper object is exposed in the browser console as `__ffc`:

```js
__ffc.game.crashAt = 50          // make the current round last longer
__ffc.jump(Math.log(4) / 0.085)  // skip ahead to about 4×
__ffc.breach()                   // humpback whale jump
__ffc.shark()                    // send a shark past
__ffc.lunge()                    // shark leaps at a fish
__ffc.dolphins()                 // dolphin pod
__ffc.orcas()                    // orca pod
__ffc.theme(2)                   // 0 sunset, 1 tropical, 2 aurora, 3 dawn
```

Balance, recent results, your bet history and the chosen sky are saved in `localStorage` under the key `flying-fish-catcher-v2`. Clear it from the browser's dev tools to start fresh.

---

## Notes

- This is a play-money game. `Math.random()` decides the crash point, which is fine for a demo but not for real money. Real-money betting needs a gambling licence where you operate and a certified, provably fair random number generator.
- Fonts: Saira Stencil One and Barlow Semi Condensed from Google Fonts.
- Performance: everything is redrawn every frame. If a phone struggles, lower the particle cap in `updateParts()` (`1400`) or the sardine count in `spawnSardines()`.
