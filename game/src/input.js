// GOBBLE DASH — The Great Turkey Escape
// input.js — keyboard + mouse. Reads actions once per frame so a key held down
// does not repeat, and exposes the held state for jumping, ducking and running.

export const ACTION_JUMP = 1;
export const ACTION_DUCK = 2;
export const ACTION_CONFIRM = 4;
export const ACTION_PAUSE = 8;
export const ACTION_RESTART = 16;

const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);
const DUCK_KEYS = new Set(['ArrowDown', 'KeyS']);
const CONFIRM_KEYS = new Set(['Enter', 'Space']);
const PAUSE_KEYS = new Set(['KeyP', 'Escape']);
const RESTART_KEYS = new Set(['KeyR']);

export function createInput(canvas) {
  const held = new Set();
  let queued = 0;
  let clickQueued = false;

  function keyDown(e) {
    if (JUMP_KEYS.has(e.code) || DUCK_KEYS.has(e.code) || e.code === 'Space') e.preventDefault();
    if (e.repeat) return;
    held.add(e.code);
    if (JUMP_KEYS.has(e.code)) queued |= ACTION_JUMP;
    if (CONFIRM_KEYS.has(e.code)) queued |= ACTION_CONFIRM;
    if (PAUSE_KEYS.has(e.code)) queued |= ACTION_PAUSE;
    if (RESTART_KEYS.has(e.code)) queued |= ACTION_RESTART;
  }
  function keyUp(e) {
    held.delete(e.code);
  }
  function mouseDown(e) {
    e.preventDefault();
    clickQueued = true;
    queued |= ACTION_CONFIRM;
  }
  function blur() {
    held.clear();
  }

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  window.addEventListener('blur', blur);
  canvas.addEventListener('mousedown', mouseDown);
  canvas.addEventListener('touchstart', mouseDown, { passive: false });

  return {
    /** Actions pressed since the last call (cleared by reading). */
    takeActions() {
      const a = queued;
      queued = 0;
      clickQueued = false;
      return a;
    },
    /** True while a duck key is held down. */
    duckHeld() {
      for (const code of DUCK_KEYS) if (held.has(code)) return true;
      return false;
    },
    /** True while a jump key is held down (for a slightly higher jump). */
    jumpHeld() {
      for (const code of JUMP_KEYS) if (held.has(code)) return true;
      return false;
    },
    /** True if the last confirm was a mouse/touch click (for button hit tests). */
    clickQueued() {
      return clickQueued;
    },
    dispose() {
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', blur);
      canvas.removeEventListener('mousedown', mouseDown);
      canvas.removeEventListener('touchstart', mouseDown);
    },
  };
}
