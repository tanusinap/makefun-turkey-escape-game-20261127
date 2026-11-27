// GOBBLE DASH — The Great Turkey Escape
// audio.js — WebAudio sounds only, no audio files. Everything is a small
// oscillator/envelope blip, so the game stays self-contained. Audio starts
// only after the first user gesture (browser autoplay policy); in shot and
// autopilot modes it simply stays silent.

export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      return ctx;
    } catch {
      return null;
    }
  }

  /** Unlock audio on the first gesture; call from any pointer/key handler. */
  function unlock() {
    const c = ensure();
    if (c && c.state === 'suspended') c.resume().catch(() => {});
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const c = ensure();
    if (!c || c.state !== 'running') return;
    try {
      const t0 = c.currentTime;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
      gain.gain.setValueAtTime(vol || 0.12, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(gain).connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch {
      // Audio is decoration; never let it break the game.
    }
  }

  function noteAt(freq, start, dur, type, vol) {
    if (muted) return;
    const c = ensure();
    if (!c || c.state !== 'running') return;
    try {
      const t0 = c.currentTime + start;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type || 'triangle';
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(vol || 0.12, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(gain).connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch {
      // Audio is decoration; never let it break the game.
    }
  }

  return {
    unlock,
    setMuted(v) { muted = !!v; },
    isMuted() { return muted; },
    /** Short rising blip when the turkey jumps. */
    jump() { tone(280, 0.14, 'square', 0.07, 620); },
    /** Two-note ding when corn or a feather is collected. */
    collect(golden) {
      noteAt(golden ? 880 : 660, 0, 0.09, 'sine', 0.11);
      noteAt(golden ? 1320 : 990, 0.07, 0.12, 'sine', 0.11);
    },
    /** Low thud when the turkey stumbles into an obstacle. */
    hit() { tone(140, 0.22, 'sawtooth', 0.14, 60); },
    /** A quick turkey gobble: three low honks. */
    gobble() {
      tone(220, 0.09, 'sawtooth', 0.09, 160);
      setTimeout(() => tone(200, 0.09, 'sawtooth', 0.09, 150), 110);
      setTimeout(() => tone(240, 0.12, 'sawtooth', 0.09, 170), 220);
    },
    /** Descending notes when the farmer catches the turkey. */
    caught() {
      noteAt(392, 0, 0.18, 'triangle', 0.13);
      noteAt(311, 0.16, 0.18, 'triangle', 0.13);
      noteAt(233, 0.32, 0.3, 'triangle', 0.13);
    },
    /** Rising fanfare when the turkey reaches the forest. */
    escaped() {
      const seq = [523, 659, 784, 1047];
      seq.forEach((f, i) => noteAt(f, i * 0.11, 0.16, 'triangle', 0.12));
      noteAt(1319, 0.46, 0.3, 'triangle', 0.12);
    },
    /** Soft tick for menu clicks. */
    click() { tone(520, 0.05, 'sine', 0.07); },
  };
}
