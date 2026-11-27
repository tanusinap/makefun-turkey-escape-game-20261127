# Gobble Dash — The Great Turkey Escape

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/tanusinap/makefun-turkey-escape-game-20261127/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard)
[![reward](https://make.fun/badge/turkey-run-game-01/tanusinap/makefun-turkey-escape-game-20261127/reward.svg)](https://make.fun/bounty/turkey-run-game-01)

Bounty: https://make.fun/bounty/turkey-run-game-01

Gobble Dash is a complete, original 2D turkey escape game in plain HTML, CSS and JavaScript. One canvas, no libraries, no network requests, no image or audio assets: every visual is drawn in code and every sound is synthesized with WebAudio. Thanksgiving is coming and the farmer wants dinner. You are the turkey. Run 1000 m from the farmyard, through the barnyard and the kitchen, to the forest, and do not let the farmer catch you.

## Controls

- **Space / Up / W** — jump (over the fence, hay bale, pumpkin and oven)
- **Down / S** — duck (slide under the carving knife)
- **P / Esc** — pause
- **R / Space / click** — restart on the end screen; **Space / click** — start on the title screen
- **Mouse** — click the Start / Restart buttons

## How it plays

The turkey auto-runs right and the world scrolls left. The farmer starts 250 px behind; every stumble lets him gain 75 px, running clean pulls ahead again. If he closes the gap he grabs the turkey: CAUGHT. Jump the fence, hay bale, pumpkin and the oven (kitchen stage); duck under the carving knife, whose blade hangs at head height. Corn +10, feather +5, golden corn +25. Three hearts, speed rises with distance. Four stages: Farmyard (0 m), Barnyard (250 m), Kitchen (500 m, oven and knife), Forest (750 m). Reach 1000 m and the turkey escapes. The HUD shows score, distance (m / 1000 m), stage, hearts, best, a progress bar to the forest, a farmer-proximity readout and a red warning when he is right behind you, plus speed in km/h. Title, play, paused and end screens (ESCAPED! / CAUGHT!) with final score, distance and Restart.

## Source layout (one clear job per file)

- `game/index.html` — canvas shell, loads the modules.
- `game/style.css` — full-window canvas, hidden screen-reader status line.
- `game/src/config.js` — tuning, palette, stages, obstacle definitions.
- `game/src/random.js` — seeded RNG (mulberry32) for reproducible runs.
- `game/src/input.js` — keyboard + mouse, one-shot actions + held state.
- `game/src/audio.js` — WebAudio sounds only (jump, collect, hit, gobble, caught, escaped, click). Silent until the first gesture.
- `game/src/world.js` — state, physics, farmer chase, spawning, collisions, and the autopilot.
- `game/src/render.js` — all canvas drawing: sky, farm/barn/kitchen/forest backdrops, turkey, farmer, obstacles, pickups, HUD, title/pause/end.
- `game/src/shots.js` — staged screenshot scenes.
- `game/src/main.js` — boot, fixed-step loop, screen flow, `window.G` probe handle for headless tests.

## Demo modes (for screenshots, harmless in play)

- `?auto=1` — the autopilot plays by itself (attract mode).
- `?seed=N` — fixes the obstacle pattern, so runs are reproducible.
- `?shot=start|play|caught|escaped&seed=N` — stages one fixed scene, paints it twice and sets `window.__shotReady` for a screenshot.

## How to run

The game is plain static files, but Chrome blocks ES modules from `file://` URLs by CORS policy, so serve it over HTTP (any static server) and open `game/index.html`:

```sh
node serve.ts
# then open http://localhost:8080
```

To hand the entry in (what the grader runs):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Verified

- `node --check` clean on all 8 source modules.
- Autopilot 30 s (`?auto=1&seed=1`): score 833, 413 m, still playing. No console errors.
- Autopilot 45 s (`?auto=1&seed=1`): score 1160, 650 m, stage 2 (kitchen), still playing. No console errors.
- Node simulation, 40 s, three seeds: seed 1 and seed 42 survived 40 s; seed 7 caught at 38.9 s. The game is challenging but fair.
- Caught path and escaped path both render their end screens with reason, score, distance and Restart. Restart from the caught end screen works (R key).
- All five obstacle types seen on screen in a live stage-2 run: fence, hay, pumpkin, knife, oven.
- No console errors on title, play, caught, escaped or restart. No external URLs in `game/`.
