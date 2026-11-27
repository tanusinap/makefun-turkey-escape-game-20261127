// GOBBLE DASH — The Great Turkey Escape
// world.js — the game state and its rules. Fixed 1/60 s steps: the turkey
// auto-runs right, the world scrolls left, the farmer chases from behind.
// Obstacles are jumped (fence, hay, pumpkin, oven) or ducked under (knife).
// Corn and feathers add score. Reach 1000 m and the turkey escapes; lose
// all 3 lives, or let the farmer close the gap, and it is caught.

import {
  FIELD, STEP, PX_PER_METRE, GOAL_METRES, TURKEY, LIVES, FARMER,
  OBSTACLE, PICKUP, STAGES, DIFFICULTY,
} from './config.js';

export const EVENT_NONE = 0;
export const EVENT_HIT = 1;
export const EVENT_PICKUP = 2;
export const EVENT_CAUGHT = 4;
export const EVENT_ESCAPED = 8;
export const EVENT_OVER = EVENT_CAUGHT | EVENT_ESCAPED;

const OBSTACLE_TYPES = Object.keys(OBSTACLE);

export function createWorld(random) {
  const state = {
    time: 0,
    distancePx: 0,
    distance: 0,          // metres
    score: 0,
    lives: LIVES,
    gap: FARMER.startGap, // px between farmer and turkey; 0 = caught
    speed: STAGES[0].speed,
    stage: 0,
    turkey: { y: FIELD.groundY - TURKEY.height, vy: 0, onGround: true, ducking: false, runPhase: 0, invulnerable: 0 },
    obstacles: [],
    pickups: [],
    leaves: [],
    particles: [],
    spawnTimer: 1.0,
    pickupTimer: 0.6,
    cleanTimer: 0,
    over: false,
    outcome: null,        // 'caught' | 'escaped'
    reason: '',
    best: 0,
    pickupScore: 0,       // points from corn / feathers, kept apart from distance points
  };

  function stageFor(distance) {
    let s = 0;
    for (let i = 0; i < STAGES.length; i++) if (distance >= STAGES[i].from) s = i;
    return s;
  }

  function currentSpeed() {
    const stageSpeed = STAGES[state.stage].speed;
    const extra = Math.min(90, state.distance * DIFFICULTY.speedPerMetre);
    return Math.min(DIFFICULTY.speedCap, stageSpeed + extra);
  }

  function spawnObstacleGroup() {
    const stage = state.stage;
    const available = OBSTACLE_TYPES.filter((t) => OBSTACLE[t].minStage <= stage);
    const type = random.pick(available);
    const def = OBSTACLE[type];
    const x = FIELD.width + random.range(40, 140);
    const obstacle = { type, kind: def.kind, x, y: FIELD.groundY - def.height - (def.lift || 0), width: def.width, height: def.height, passed: false, hit: false };
    state.obstacles.push(obstacle);
    // Sometimes a second obstacle behind, for a double jump (far enough
    // that the turkey lands from the first jump before it must jump again).
    if (stage >= 1 && random.next() < 0.3) {
      const type2 = random.pick(available.filter((t) => OBSTACLE[t].kind === 'jump'));
      const def2 = OBSTACLE[type2];
      state.obstacles.push({
        type: type2, kind: 'jump',
        x: x + def.width + random.range(250, 350),
        y: FIELD.groundY - def2.height - (def2.lift || 0), width: def2.width, height: def2.height,
        passed: false, hit: false,
      });
    }
  }

  function spawnPickupArc() {
    const baseX = FIELD.width + random.range(60, 220);
    const kind = random.next() < 0.12 ? 'goldenCorn' : (random.next() < 0.3 ? 'feather' : 'corn');
    const def = PICKUP[kind];
    const arc = random.next() < 0.5;
    for (let i = 0; i < 3; i++) {
      const x = baseX + i * 46;
      const y = arc
        ? FIELD.groundY - 150 - Math.sin((i / 2) * Math.PI) * 70
        : FIELD.groundY - 90 - random.range(0, 60);
      state.pickups.push({ kind, x, y, size: def.size, points: def.points, taken: false, bob: random.range(0, 6.28) });
    }
  }

  function spawnLeaf() {
    state.leaves.push({
      x: random.range(0, FIELD.width),
      y: random.range(-20, 0),
      size: random.range(5, 11),
      vy: random.range(24, 60),
      sway: random.range(0, 6.28),
      swaySpeed: random.range(1, 2.4),
      color: random.pick(['#d2691e', '#e8a33c', '#c0392b', '#e8c33c']),
    });
  }

  function turkeyBox() {
    const t = state.turkey;
    const h = t.ducking ? TURKEY.duckHeight : TURKEY.height;
    const s = TURKEY.hitShrink;
    return {
      x: TURKEY.x + s, y: t.y + s,
      w: TURKEY.width - s * 2, h: h - s,
    };
  }

  function obstacleBox(o) {
    // The knife is a low blade: only its lower part hurts (duck under it).
    if (o.type === 'knife') return { x: o.x + 6, y: o.y + 4, w: o.width - 12, h: o.height - 4 };
    return { x: o.x + 5, y: o.y + 4, w: o.width - 10, h: o.height - 4 };
  }

  function overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      state.particles.push({
        x, y, vx: random.range(-140, 60), vy: random.range(-220, -40),
        life: random.range(0.3, 0.7), maxLife: 0.7, size: random.range(3, 7), color,
      });
    }
  }

  function reset() {
    state.time = 0;
    state.distancePx = 0;
    state.distance = 0;
    state.score = 0;
    state.lives = LIVES;
    state.gap = FARMER.startGap;
    state.speed = STAGES[0].speed;
    state.stage = 0;
    state.turkey.y = FIELD.groundY - TURKEY.height;
    state.turkey.vy = 0;
    state.turkey.onGround = true;
    state.turkey.ducking = false;
    state.turkey.runPhase = 0;
    state.turkey.invulnerable = 0;
    state.obstacles = [];
    state.pickups = [];
    state.leaves = [];
    state.particles = [];
    state.spawnTimer = 1.1;
    state.pickupTimer = 0.7;
    state.cleanTimer = 0;
    state.over = false;
    state.outcome = null;
    state.reason = '';
    state.pickupScore = 0;
    for (let i = 0; i < 14; i++) spawnLeaf();
  }

  /** The autopilot: looks ahead and decides jump / duck. Returns { jump, duck }. */
  function autopilot() {
    const t = state.turkey;
    const speed = state.speed;
    let jump = false;
    let duck = false;
    let nearest = null;
    let nearestDist = Infinity;
    for (const o of state.obstacles) {
      const d = o.x - (TURKEY.x + TURKEY.width);
      // An obstacle counts until its right edge has passed the turkey's left
      // edge: a wide knife is still dangerous after its left edge is behind
      // the turkey's front, and the turkey must keep ducking until it clears.
      const passed = o.x + o.width < TURKEY.x - 10;
      if (!passed && d < nearestDist) { nearest = o; nearestDist = d; }
    }
    if (nearest) {
      const timeToHit = nearestDist / speed;
      if (nearest.kind === 'jump') {
        // Jump when the obstacle is close. The floaty jump stays above
        // obstacle height for ~0.65 s, so the timing has real slack.
        if (t.onGround && timeToHit < 0.22 && timeToHit > 0.01) jump = true;
      } else {
        // Duck under the knife once it is close.
        if (timeToHit < 0.42) duck = true;
      }
    }
    // If a pickup floats high in a jump arc, hop for it — but only when no
    // obstacle is near, so a corn hop never wrecks the timing of a real jump.
    if (!jump && t.onGround && (!nearest || nearestDist > 380)) {
      for (const p of state.pickups) {
        const d = p.x - (TURKEY.x + TURKEY.width);
        if (d > 40 && d < 220 && p.y < FIELD.groundY - 130) { jump = true; break; }
      }
    }
    return { jump, duck };
  }

  /**
   * Advance the world one fixed step.
   * @param {number} dt step seconds (STEP)
   * @param {{jump:boolean, duck:boolean}} input player input this step
   * @param {boolean} auto true when the autopilot drives
   * @returns {number} event flags
   */
  function step(dt, input, auto) {
    if (state.over) return EVENT_NONE;
    state.time += dt;
    const t = state.turkey;
    const speed = currentSpeed();
    state.speed = speed;
    state.stage = stageFor(state.distance);

    // --- turkey vertical motion ---
    let wantJump = input.jump;
    let wantDuck = input.duck;
    if (auto) {
      const a = autopilot();
      wantJump = a.jump;
      wantDuck = a.duck;
    }
    if (wantJump && t.onGround && !t.ducking) {
      t.vy = -TURKEY.jumpVelocity;
      t.onGround = false;
    }
    t.ducking = wantDuck && t.onGround;
    if (!t.onGround) {
      t.vy += TURKEY.gravity * dt;
      t.y += t.vy * dt;
      const ground = FIELD.groundY - (t.ducking ? TURKEY.duckHeight : TURKEY.height);
      if (t.y >= ground) {
        t.y = ground;
        t.vy = 0;
        t.onGround = true;
      }
    } else {
      t.y = FIELD.groundY - (t.ducking ? TURKEY.duckHeight : TURKEY.height);
    }
    if (t.invulnerable > 0) t.invulnerable -= dt;
    t.runPhase += dt * (speed / 34);

    // --- distance & score ---
    state.distancePx += speed * dt;
    state.distance = state.distancePx / PX_PER_METRE;
    state.score = Math.floor(state.distance) + state.pickupScore;

    // --- farmer chase ---
    state.cleanTimer += dt;
    if (state.cleanTimer > 5) {
      state.gap = Math.min(FARMER.maxGap, state.gap + FARMER.recoverPerSecond * dt);
    }
    if (state.gap <= FARMER.catchGap) {
      state.over = true;
      state.outcome = 'caught';
      state.reason = 'The farmer grabbed the turkey!';
      burst(TURKEY.x + 30, t.y + 30, '#e8a33c', 18);
      return EVENT_CAUGHT;
    }
    if (state.distance >= GOAL_METRES) {
      state.over = true;
      state.outcome = 'escaped';
      state.reason = 'The turkey reached the forest!';
      burst(TURKEY.x + 30, t.y + 20, '#f2c94c', 24);
      return EVENT_ESCAPED;
    }

    // --- spawning ---
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnObstacleGroup();
      const interval = Math.max(
        DIFFICULTY.spawnIntervalMin,
        DIFFICULTY.spawnInterval - state.stage * DIFFICULTY.spawnIntervalPerStage,
      );
      state.spawnTimer = interval * random.range(0.9, 1.25);
    }
    state.pickupTimer -= dt;
    if (state.pickupTimer <= 0) {
      spawnPickupArc();
      state.pickupTimer = random.range(1.6, 2.8);
    }

    // --- move obstacles & pickups ---
    const move = speed * dt;
    for (const o of state.obstacles) o.x -= move;
    for (const p of state.pickups) { p.x -= move; p.bob += dt * 4; }
    state.obstacles = state.obstacles.filter((o) => o.x + o.width > -80);
    state.pickups = state.pickups.filter((p) => p.x + p.size > -40);

    // --- leaves drift ---
    if (random.next() < dt * 6) spawnLeaf();
    for (const leaf of state.leaves) {
      leaf.y += leaf.vy * dt;
      leaf.sway += leaf.swaySpeed * dt;
      leaf.x += Math.sin(leaf.sway) * 26 * dt;
    }
    state.leaves = state.leaves.filter((l) => l.y < FIELD.height + 12);

    // --- particles ---
    for (const p of state.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 500 * dt;
    }
    state.particles = state.particles.filter((p) => p.life > 0);

    // --- collisions ---
    const box = turkeyBox();
    let events = EVENT_NONE;
    if (t.invulnerable <= 0) {
      for (const o of state.obstacles) {
        if (!o.hit && overlaps(box, obstacleBox(o))) {
          o.hit = true;
          state.lives -= 1;
          state.gap = Math.max(0, state.gap - FARMER.gainOnHit);
          state.cleanTimer = 0;
          t.invulnerable = 1.2;
          burst(TURKEY.x + 30, t.y + 30, '#e5534b', 14);
          events |= EVENT_HIT;
          if (state.lives <= 0) {
            state.over = true;
            state.outcome = 'caught';
            state.reason = o.type === 'oven'
              ? 'The turkey tumbled into the oven!'
              : o.type === 'knife'
                ? 'The carving knife caught the turkey!'
                : 'The turkey tripped and the farmer caught up!';
            return events | EVENT_CAUGHT;
          }
          break;
        }
      }
    }
    // Near miss: an obstacle just passed while the turkey is close earns a little fear.
    for (const o of state.obstacles) {
      if (!o.passed && o.x + o.width < TURKEY.x) {
        o.passed = true;
        const clearance = Math.abs((t.y + TURKEY.height) - FIELD.groundY);
        if (clearance < 30 && t.invulnerable <= 0) {
          state.gap = Math.max(0, state.gap - FARMER.gainOnNearMiss);
          state.cleanTimer = 0;
        }
      }
    }
    // Pickups.
    for (const p of state.pickups) {
      if (p.taken) continue;
      const pb = { x: p.x - p.size / 2, y: p.y - p.size / 2 + Math.sin(p.bob) * 3, w: p.size, h: p.size };
      if (overlaps(box, pb)) {
        p.taken = true;
        state.pickupScore += p.points;
        state.score = Math.floor(state.distance) + state.pickupScore;
        burst(p.x, p.y, p.kind === 'goldenCorn' ? '#f2c94c' : '#e8a33c', 8);
        events |= EVENT_PICKUP;
      }
    }
    state.pickups = state.pickups.filter((p) => !p.taken);

    return events;
  }

  return { state, reset, step, autopilot, stageFor, turkeyBox };
}
