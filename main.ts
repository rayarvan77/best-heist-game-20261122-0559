// Midnight Gallery — the hand-in program for the make.fun best heist game
// bounty (Node 22, standard library only).
//
// The game itself is plain static files in game/ (an index.html plus ES
// modules, no library, no network request at all). This program copies
// game/ and screenshots/ from beside this file into the hand-in directory
// — /output inside the grader, or $MAKEFUN_OUTPUT_DIR anywhere else — and
// writes /output/dossier.json, the summary the judge reads, using the
// vendored make.fun library in vendor/makefun-game.ts.
//
// Run it locally to check the hand-in before submitting:
//   MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps below mirror the scorer's own limits, so a hand-in this program
// accepts is one the gate accepts too: at most 4 screenshots, each at most
// 256 KiB; game/ at most 993 files and 48 MiB in total, no path longer
// than 1000 bytes; the dossier text capped at 160 KiB.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// Say what landed, so a local run shows the hand-in at a glance.
console.log(`Midnight Gallery handed in to ${out} (game/, screenshots/, dossier.json).`);
