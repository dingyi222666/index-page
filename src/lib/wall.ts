/* ------------------------------------------------------------------ */
/* Wall — where the project cards land                                 */
/*                                                                     */
/* One coordinate system: the stage is 100 units wide and               */
/* 100 / aspect units tall, and a unit is always one vw. A card's       */
/* height falls out of its own aspect box, so nothing here has to       */
/* know about pixels or about the window being a phone.                 */
/*                                                                     */
/* Placement is Mitchell's best-candidate — blue noise. For each card    */
/* throw K candidates at the field and keep the one furthest from        */
/* everything already laid down. Blue noise is exactly the               */
/* "random but composed" look: never clumped, never gridded. A           */
/* relaxation pass then pushes any surviving pair apart, so the result   */
/* is genuinely scattered and still never overlaps. The whole thing      */
/* runs `attempts` times with different seeds and the best composition   */
/* wins, which is what stops "random" from ever meaning "ugly".          */
/* ------------------------------------------------------------------ */

export type Box = { x0: number; y0: number; x1: number; y1: number };

export type WallSlot = {
  /** vw from the left edge of the stage, card at its unrotated size. */
  left: number;
  /** percentage of the stage height, card at its unrotated size. */
  top: number;
  /** vw. Height follows from the card's own aspect-ratio. */
  w: number;
  rot: number;
  z: number;
  /** Which edge the card flies in from, so it comes from the side it sits on. */
  fromLeft: boolean;
  fromRight: boolean;
};

export type WallSpec = { portrait: boolean };

export type WallOptions = {
  /** Stage width / height. */
  fieldAspect: number;
  /** vw kept clear at the top (the header) and bottom of the stage. */
  topInset: number;
  bottomInset: number;
  /** Regions the cards must not enter — the headline box, the nav bar. */
  keepOut: Box[];
  /** Multiplies the card widths: 1 on desktop, ~2 on a phone. */
  scale: number;
  seed: number;
  attempts?: number;
};

type Placed = {
  index: number;
  w: number;
  h: number;
  rot: number;
  cx: number;
  cy: number;
  /** Half-extents of the rectangle *after* rotation — the box that
   *  actually collides. */
  hw: number;
  hh: number;
  z: number;
};

const FIELD_W = 100;
/** Card width in vw before `scale`: portrait, landscape. */
const BASE_W = { portrait: 13, landscape: 26 };
/** Tilt stays in a narrow band — past ten degrees or so a card stops
 *  reading as laid down by hand and starts reading as a mistake. */
const MAX_TILT = 9;
/** Breathing room demanded between two cards, in vw. */
const PAD = 0.9;
/** Candidates drawn per card when hunting for a spot. */
const SAMPLES = 64;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (rnd: () => number, a: number, b: number) => a + (b - a) * rnd();
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** Half-extents of a w×h rectangle rotated by `deg` — the axis-aligned box
 *  that contains it, which is what two rotated cards have to not share. */
function halfExtents(w: number, h: number, deg: number) {
  const r = (deg * Math.PI) / 180;
  const c = Math.abs(Math.cos(r));
  const s = Math.abs(Math.sin(r));
  return { hw: (w * c + h * s) / 2, hh: (w * s + h * c) / 2 };
}

/** Distance between two boxes: positive when they are apart, negative
 *  (the penetration depth) when they are not. */
function gap(a: Placed, b: Placed) {
  const dx = Math.abs(a.cx - b.cx) - (a.hw + b.hw);
  const dy = Math.abs(a.cy - b.cy) - (a.hh + b.hh);
  if (dx >= 0 || dy >= 0) return Math.hypot(Math.max(0, dx), Math.max(0, dy));
  return -Math.min(-dx, -dy);
}

function gapToBox(it: Placed, box: Box) {
  const bx = (box.x0 + box.x1) / 2;
  const by = (box.y0 + box.y1) / 2;
  const dx = Math.abs(it.cx - bx) - ((box.x1 - box.x0) / 2 + it.hw);
  const dy = Math.abs(it.cy - by) - ((box.y1 - box.y0) / 2 + it.hh);
  if (dx >= 0 || dy >= 0) return Math.hypot(Math.max(0, dx), Math.max(0, dy));
  return -Math.min(-dx, -dy);
}

/** Sizes and tilts, largest first so the big cards get the pick of the
 *  field and the small ones fill what is left — the order a person would
 *  lay them down in. Big sits behind, small on top, which is what makes
 *  the pile read as a pile. */
function draft(specs: WallSpec[], rnd: () => number, scale: number): Placed[] {
  const items = specs.map((s, index) => {
    const key = s.portrait ? "portrait" : "landscape";
    const w = BASE_W[key] * scale * between(rnd, 0.9, 1.1);
    const h = w / (s.portrait ? 9 / 16 : 16 / 9);
    const rot = between(rnd, -MAX_TILT, MAX_TILT);
    return { index, w, h, rot, cx: 0, cy: 0, z: 0, ...halfExtents(w, h, rot) };
  });

  items.sort((a, b) => b.w * b.h - a.w * a.h);
  items.forEach((it, i) => {
    it.z = items.length - i;
  });
  return items;
}

/** Mitchell's best-candidate: draw SAMPLES spots, keep the roomiest. */
function scatter(items: Placed[], rnd: () => number, bounds: Box, keepOut: Box[]) {
  const placed: Placed[] = [];

  for (const it of items) {
    // A card wider than the field would make the sampling range invert, so
    // the range is collapsed to the centre when that happens.
    const loX = Math.min(bounds.x0 + it.hw, FIELD_W / 2);
    const hiX = Math.max(bounds.x1 - it.hw, FIELD_W / 2);
    const loY = Math.min(bounds.y0 + it.hh, (bounds.y0 + bounds.y1) / 2);
    const hiY = Math.max(bounds.y1 - it.hh, (bounds.y0 + bounds.y1) / 2);

    let bestX = (loX + hiX) / 2;
    let bestY = (loY + hiY) / 2;
    let bestScore = -Infinity;

    for (let k = 0; k < SAMPLES; k++) {
      it.cx = between(rnd, loX, hiX);
      it.cy = between(rnd, loY, hiY);

      let clear = Infinity;
      for (const p of placed) clear = Math.min(clear, gap(it, p));
      for (const box of keepOut) clear = Math.min(clear, gapToBox(it, box));

      const score = clear + edgeBonus(it, bounds);
      if (score > bestScore) {
        bestScore = score;
        bestX = it.cx;
        bestY = it.cy;
      }
    }

    it.cx = bestX;
    it.cy = bestY;
    placed.push(it);
  }
}

/** A willingness to sit out toward the frame. Pure clearance maximisation
 *  piles everything into the corners away from the headline; this pulls the
 *  mass back out across the sheet without letting it drift to dead centre. */
function edgeBonus(it: Placed, bounds: Box) {
  const dx = Math.abs(it.cx - (bounds.x0 + bounds.x1) / 2) / ((bounds.x1 - bounds.x0) / 2);
  const dy = Math.abs(it.cy - (bounds.y0 + bounds.y1) / 2) / ((bounds.y1 - bounds.y0) / 2);
  return 1.3 * Math.min(1, Math.hypot(dx, dy) / 1.2);
}

/** Push overlapping pairs apart along whichever axis needs less movement.
 *  Damped and repeated, so it settles instead of oscillating. */
function relax(items: Placed[], bounds: Box, keepOut: Box[], passes = 90) {
  for (let pass = 0; pass < passes; pass++) {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        const dx = b.cx - a.cx;
        const dy = b.cy - a.cy;
        const ox = a.hw + b.hw + PAD - Math.abs(dx);
        const oy = a.hh + b.hh + PAD - Math.abs(dy);
        if (ox <= 0 || oy <= 0) continue;

        if (ox < oy) {
          const push = ox * 0.3;
          const dir = dx === 0 ? (i % 2 ? 1 : -1) : Math.sign(dx);
          a.cx -= dir * push;
          b.cx += dir * push;
        } else {
          const push = oy * 0.3;
          const dir = dy === 0 ? (i % 2 ? 1 : -1) : Math.sign(dy);
          a.cy -= dir * push;
          b.cy += dir * push;
        }
      }
    }

    for (const it of items) {
      for (const box of keepOut) {
        const dx = it.cx - (box.x0 + box.x1) / 2;
        const dy = it.cy - (box.y0 + box.y1) / 2;
        const ox = (box.x1 - box.x0) / 2 + it.hw + PAD - Math.abs(dx);
        const oy = (box.y1 - box.y0) / 2 + it.hh + PAD - Math.abs(dy);
        if (ox > 0 && oy > 0) {
          if (ox < oy) it.cx += (dx >= 0 ? 1 : -1) * ox * 0.3;
          else it.cy += (dy >= 0 ? 1 : -1) * oy * 0.3;
        }
      }

      it.cx = clamp(it.cx, bounds.x0 + it.hw, Math.max(bounds.x1 - it.hw, FIELD_W / 2));
      it.cy = clamp(
        it.cy,
        bounds.y0 + it.hh,
        Math.max(bounds.y1 - it.hh, (bounds.y0 + bounds.y1) / 2),
      );
    }
  }
}

/** How good a finished composition is. Judged on the tightest gap (breathing
 *  room, and any overlap is punished hard), on how evenly the cards divide a
 *  3×3 of the field (no empty quadrant, no pile), and on how much of the
 *  frame the arrangement actually uses. */
function rate(items: Placed[], bounds: Box, keepOut: Box[]) {
  let minGap = Infinity;
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      minGap = Math.min(minGap, gap(items[i], items[j]));
    }
  }
  if (!Number.isFinite(minGap)) minGap = 4;

  // A card parked on the headline costs a flat penalty, so the search always
  // prefers a composition where the banner is clear.
  let intruding = 0;
  for (const it of items) {
    for (const box of keepOut) if (gapToBox(it, box) < 0) intruding++;
  }

  const w = bounds.x1 - bounds.x0;
  const h = bounds.y1 - bounds.y0;
  const cells = new Array(9).fill(0);
  let framed = 0;

  for (const it of items) {
    const gx = clamp(Math.floor(((it.cx - bounds.x0) / w) * 3), 0, 2);
    const gy = clamp(Math.floor(((it.cy - bounds.y0) / h) * 3), 0, 2);
    cells[gy * 3 + gx]++;

    const dx = Math.abs(it.cx - (bounds.x0 + bounds.x1) / 2) / (w / 2);
    const dy = Math.abs(it.cy - (bounds.y0 + bounds.y1) / 2) / (h / 2);
    if (dx > 0.42 || dy > 0.42) framed++;
  }

  const mean = items.length / 9;
  const deviation = Math.sqrt(cells.reduce((s, c) => s + (c - mean) ** 2, 0) / 9);
  const balance = Math.max(0, 1 - deviation / Math.max(mean, 1e-6));

  return (
    1.9 * Math.min(minGap, 4.5) + // generous gaps, up to a point
    7 * Math.min(minGap, 0) + // and never, ever an overlap
    1.4 * balance +
    0.9 * (framed / items.length) -
    8 * intruding
  );
}

export function layoutWall(specs: WallSpec[], opts: WallOptions): WallSlot[] {
  const { fieldAspect, topInset, bottomInset, keepOut, scale, seed } = opts;
  const attempts = opts.attempts ?? 32;
  const fieldH = FIELD_W / Math.max(0.6, fieldAspect);
  const bounds: Box = { x0: 1, x1: FIELD_W - 1, y0: topInset, y1: fieldH - bottomInset };

  let best: Placed[] | null = null;
  let bestScore = -Infinity;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const rnd = mulberry32(seed + attempt * 7919);
    const items = draft(specs, rnd, scale);
    scatter(items, rnd, bounds, keepOut);
    relax(items, bounds, keepOut);

    const score = rate(items, bounds, keepOut);
    if (score > bestScore) {
      bestScore = score;
      best = items;
    }
  }

  const slots: WallSlot[] = new Array(specs.length);
  for (const it of best ?? []) {
    slots[it.index] = {
      left: it.cx - it.w / 2,
      top: ((it.cy - it.h / 2) / fieldH) * 100,
      w: it.w,
      rot: it.rot,
      z: it.z,
      fromLeft: it.cx < FIELD_W * 0.34,
      fromRight: it.cx > FIELD_W * 0.66,
    };
  }
  return slots;
}
