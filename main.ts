// Gobble Dash — The Great Turkey Escape: hand-in program (Node 22, standard library only).
//
// The game lives in this directory's game/ folder: plain static files a
// desktop browser opens offline (game/index.html plus its ES modules,
// no library, no network request, no image or audio assets — all art is
// drawn in code and all sound is WebAudio). This program hands the game
// in: it copies game/ and screenshots/ from beside this file into
// /output and writes /output/dossier.json, the summary the judge reads,
// with the vendored make.fun library (vendor/makefun-game.ts, copied
// from the kit unchanged).
//
// The copy steps are best-effort with a warning on stderr if one fails,
// so a missing optional file can never crash the run. The only fatal
// step is the dossier itself: if /output/dossier.json cannot be
// written, the entry has nothing for the scorer to read, so the program
// exits non-zero.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The repository root: the folder this file sits in.
const here = fileURLToPath(new URL('.', import.meta.url));
// Where the graded files go: the grader's /output, or MAKEFUN_OUTPUT_DIR
// when run outside the grader's container (local testing).
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Copy one directory tree into `to`, warning instead of crashing on failure. */
function copyTree(from: string, to: string, label: string): boolean {
  if (!existsSync(from)) {
    process.stderr.write(`gobble dash: no ${label} folder at ${from}, skipping\n`);
    return false;
  }
  try {
    cpSync(from, to, { recursive: true });
    return true;
  } catch (error) {
    process.stderr.write(`gobble dash: could not copy ${label}: ${error}\n`);
    return false;
  }
}

// Make sure the output directory exists before anything is copied into it.
mkdirSync(out, { recursive: true });

// The playable game: game/index.html and every file it loads (the ES
// modules under game/src/, the stylesheet, all drawn and sounded in code).
copyTree(join(here, 'game'), join(out, 'game'), 'game');

// The screenshots: 4 real renders of the game's own code. The first by
// name is the cover, so the files are named 1-start.png (cover),
// 2-play.png, 3-caught.png, 4-escaped.png.
mkdirSync(join(out, 'screenshots'), { recursive: true });
copyTree(join(here, 'screenshots'), join(out, 'screenshots'), 'screenshots');

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the bytes; the others refuse an entry the scorer would refuse (more than
// 4 screenshots or one over 256 KiB; more than 993 files in game/ or
// 48 MiB of game files, in all, or a path under game/ over 1000 bytes:
// game/ counts beside /output's own 1000-entry cap, its screenshots/ and
// dossier.json).
const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

try {
  writeFileSync(join(out, 'dossier.json'), buildDossier(out, dossierCaps));
  process.stdout.write(`gobble dash: handed in game/ and screenshots/ to ${out}\n`);
} catch (error) {
  process.stderr.write(`gobble dash: could not write dossier.json: ${error}\n`);
  process.exit(1);
}
