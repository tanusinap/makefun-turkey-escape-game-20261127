// GOBBLE DASH — The Great Turkey Escape
// shots.js — staged scenes for screenshots. ?shot=start|play|caught|escaped
// (with &seed=N) paints one fixed scene instead of running the loop, paints
// it twice and sets window.__shotReady for a screenshot. Every scene is
// deterministic for a given seed.

import { STEP, FIELD, TURKEY, GOAL_METRES } from './config.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER } from './render.js';

/** Simulate the world forward with the autopilot for `seconds` of play. */
function simulate(world, seconds) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i++) {
    const events = world.step(STEP, { jump: false, duck: false }, true);
    if (world.state.over) break;
  }
}

export function stageShot(name, world) {
  const state = world.state;
  if (name === 'start') {
    world.reset();
    // A lively title backdrop: a few leaves already falling.
    state.time = 2.5;
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'play') {
    world.reset();
    // Run the autopilot into the barnyard so the shot shows a real run:
    // obstacles, corn, the knife, the farmer behind, HUD with score and distance.
    simulate(world, 22);
    if (world.state.over) {
      // The autopilot should survive this long; if it did not, reset and
      // simulate a shorter run so the shot is still a live game.
      world.reset();
      simulate(world, 13);
    }
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'caught') {
    world.reset();
    // Stage the moment of capture: the farmer right on the turkey's tail.
    simulate(world, 6);
    state.lives = 0;
    state.gap = 12;
    state.turkey.invulnerable = 0;
    state.over = true;
    state.outcome = 'caught';
    state.reason = 'The farmer grabbed the turkey!';
    return { screen: SCREEN_OVER, best: state.score };
  }
  if (name === 'escaped') {
    world.reset();
    // Stage the forest finish: the turkey at the goal, in the forest stage.
    simulate(world, 10);
    state.distancePx = GOAL_METRES * 25;
    state.distance = GOAL_METRES;
    state.score = Math.floor(state.distance) + state.pickupScore;
    state.stage = 3;
    state.gap = 250;
    state.over = true;
    state.outcome = 'escaped';
    state.reason = 'The turkey reached the forest!';
    return { screen: SCREEN_OVER, best: state.score };
  }
  // Unknown shot name: fall back to the title screen.
  world.reset();
  return { screen: SCREEN_TITLE, best: 0 };
}

// Keep the imports used (FIELD / TURKEY are the playfield contract).
export const _FIELD = FIELD;
export const _TURKEY = TURKEY;
