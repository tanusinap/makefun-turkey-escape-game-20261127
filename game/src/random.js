// GOBBLE DASH — The Great Turkey Escape
// random.js — a tiny seeded RNG (mulberry32) so a run with ?seed=N is
// reproducible, which is what makes the screenshots deterministic.

export function createRandom(seed) {
  let a = (seed >>> 0) || 0x9e3779b9;
  return {
    /** Next float in [0, 1). */
    next() {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    /** Integer in [min, max] inclusive. */
    int(min, max) {
      return min + Math.floor(this.next() * (max - min + 1));
    },
    /** Float in [min, max). */
    range(min, max) {
      return min + this.next() * (max - min);
    },
    /** Pick one item from an array. */
    pick(items) {
      return items[Math.floor(this.next() * items.length)];
    },
  };
}
