// GOBBLE DASH — The Great Turkey Escape
// main.js — boot and the one loop. Input is read every frame, the world
// advances in fixed 1/60 s steps (several in a slow frame, none in a fast
// one), and the renderer paints what is there. The game moves between four
// screens: title, play, paused and game over.
//
// ?seed=N fixes the obstacle pattern. ?auto=1 lets the autopilot play by
// itself (attract mode, and how the screenshots of a run are taken).
// ?shot=start|play|caught|escaped (with &seed=N) stages that scene instead
// of running the loop, paints it twice and sets window.__shotReady.
import { BEST_KEY, LIVES, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_HIT, EVENT_PICKUP, EVENT_CAUGHT, EVENT_ESCAPED, EVENT_OVER } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_RESTART, ACTION_JUMP, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const autoParam = params.get('auto') === '1';
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

// Debug / probe handle for headless play-tests: window.G exposes the live state.
window.G = {
  get state() { return world.state; },
  get score() { return world.state.score; },
  get distance() { return world.state.distance; },
  get lives() { return world.state.lives; },
  get gap() { return world.state.gap; },
  get stage() { return world.state.stage; },
  get over() { return world.state.over; },
  get outcome() { return world.state.outcome; },
};

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let auto = autoParam;

  // Screen readers (and anyone watching the page's text) hear the screen changes and each hit.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    audio.gobble();
    announce(`Playing. ${LIVES} lives. Run ${1000} metres to the forest.`);
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    if (world.state.outcome === 'escaped') audio.escaped();
    else audio.caught();
    announce(world.state.outcome === 'escaped'
      ? `Escaped! Score ${Math.floor(world.state.score)}. Best ${Math.floor(best)}.`
      : `Caught! Score ${Math.floor(world.state.score)}. Best ${Math.floor(best)}.`);
  }

  function handleActions(actions) {
    if (actions & ACTION_JUMP) audio.unlock();
    if (actions & ACTION_RESTART && screen === SCREEN_OVER) {
      audio.click();
      startGame();
      return;
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      audio.click();
      startGame();
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function step(actions) {
    if (screen === SCREEN_TITLE) {
      world.state.time += STEP;
      return;
    }
    const jump = !!(actions & ACTION_JUMP);
    const duck = input.duckHeld();
    const events = world.step(STEP, { jump, duck }, auto);
    if (events & EVENT_OVER) endGame();
    else if (events & EVENT_HIT) {
      audio.hit();
      announce(world.state.lives === 1 ? 'Hit. 1 life left.' : `Hit. ${world.state.lives} lives left.`);
    } else if (events & EVENT_PICKUP) {
      audio.collect(false);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    // Read actions once per frame; the same press drives both the menus
    // and the turkey (a jump is a one-frame event, so the first step eats it).
    const actions = input.takeActions();
    handleActions(actions);
    let firstStep = true;
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step(firstStep ? actions : 0);
        firstStep = false;
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting the farmer catch the turkey unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  // Autopilot starts the game by itself so ?auto=1 plays without a click.
  if (auto) {
    startGame();
    announce('Autopilot playing. Gobble Dash.');
  } else {
    announce('Gobble Dash. Press Space or click to start.');
  }
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
