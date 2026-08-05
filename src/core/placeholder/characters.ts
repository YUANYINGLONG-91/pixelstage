/**
 * Chibi character sprites — the element that makes a scene read as a game
 * screenshot instead of a landscape. Octopath proportions: oversized head
 * (~1/2.4 of height), tiny body, two-pixel eyes.
 *
 * Built programmatically from outlined shapes (silhouette in dark tone
 * expanded by one cell, then interior fills) so symmetry and shading are
 * guaranteed, then dressed per archetype: sword / staff / satchel / umbrella.
 * Sun comes from the upper right in every scene, so lights sit top-right,
 * shades bottom-left, with a warm rim on the right edge.
 */

import { HOT, Painter, type RGB, hexToRgb, mix, ramp } from "./pixel";

export type Archetype = "warrior" | "mage" | "merchant" | "runner" | "pilgrim";

interface CharSpec {
  hair: RGB[];
  cloth: RGB[];
  accent: RGB[];
  skin: RGB[];
}

const SPECS: Record<Archetype, CharSpec> = {
  warrior: {
    hair: ramp("#D8A84E"), // blond
    cloth: ramp("#3A5A8C"), // blue tunic
    accent: ramp("#8C3A32"), // red sash
    skin: ramp("#E8B88A"),
  },
  mage: {
    hair: ramp("#4A3626"), // brown (mostly hidden under hat)
    cloth: ramp("#7A3A4E"), // wine robe
    accent: ramp("#D8A84E"), // gold trim
    skin: ramp("#E8B88A"),
  },
  merchant: {
    hair: ramp("#8C5A2E"), // chestnut
    cloth: ramp("#3E6A4A"), // green coat
    accent: ramp("#C9B48A"), // tan satchel
    skin: ramp("#E8B88A"),
  },
  runner: {
    hair: ramp("#2A2E3E"), // hidden under hood
    cloth: ramp("#2E4A5E"), // raincoat
    accent: ramp("#43C8DC"), // neon trim
    skin: ramp("#E8B88A"),
  },
  pilgrim: {
    hair: ramp("#5A4A3A"), // hidden under hood
    cloth: ramp("#5A4E78"), // violet travelling cloak
    accent: ramp("#FFB648"), // lantern amber
    skin: ramp("#E8B88A"),
  },
};

/** Sprite canvas: 22 cells wide × 30 tall (44×60 px). Feet at row 29. */
const CW = 22;
const CH = 30;
const FOOT = CH - 1;

export function renderCharacter(kind: Archetype): { src: string; w: number; h: number } {
  const p = new Painter(CW * 2, CH * 2).seed(kind.length * 77 + 5);
  const s = SPECS[kind];
  const cx = 11; // body center column
  const outline: RGB = [26, 20, 28];

  // contact shadow (grounds the sprite even before the engine's cast shadow)
  p.dither(cx - 6, FOOT - 1, 13, 2, [10, 10, 16], [10, 10, 16], 0);
  for (let gx = cx - 6; gx <= cx + 6; gx++) {
    for (let gy = FOOT - 1; gy <= FOOT; gy++) {
      const d = Math.hypot((gx - cx) / 6, (gy - FOOT + 0.5) / 1.5);
      if (d < 1) p.px(gx, gy, [10, 10, 16], 0.32 * (1 - d) + 0.08);
    }
  }

  const robed = kind === "mage" || kind === "runner" || kind === "pilgrim";

  /* ------------------------------- legs & boots ------------------------------ */
  if (!robed) {
    // walking stance: left leg forward
    p.rect(cx - 3, 21, 2, 5, outline);
    p.rect(cx - 3, 21, 1, 5, s.cloth[1]);
    p.rect(cx + 1, 21, 2, 6, outline);
    p.rect(cx + 2, 21, 1, 6, s.cloth[2]);
    p.rect(cx - 4, 26, 3, 3, outline); // left boot
    p.rect(cx - 4, 26, 2, 2, mix(s.cloth[0], outline, 0.4));
    p.rect(cx + 1, 27, 3, 2, outline); // right boot
    p.rect(cx + 2, 27, 2, 1, mix(s.cloth[0], outline, 0.4));
  } else {
    // robe hem hides the legs; boots peek out
    p.rect(cx - 3, 27, 2, 2, outline);
    p.rect(cx + 2, 27, 2, 2, outline);
  }

  /* ----------------------------------- body ----------------------------------- */
  // torso: outlined trapezoid, shoulders row 13 → hem row 22 (robe: row 28)
  const hem = robed ? 28 : 22;
  for (let y = 13; y <= hem; y++) {
    const t = (y - 13) / (hem - 13);
    const half = Math.round(4 + t * (robed ? 3.4 : 1.6));
    p.rect(cx - half - 1, y, half * 2 + 2, 1, outline);
    p.rect(cx - half, y, half * 2, 1, s.cloth[2]);
    // shading: left shade, right light, dithered transition
    p.rect(cx - half, y, 2, 1, s.cloth[1]);
    p.rect(cx + half - 1, y, 1, 1, s.cloth[3]);
  }
  // belt / sash
  if (kind === "warrior") {
    p.rect(cx - 4, 18, 9, 1, s.accent[2]);
    p.px(cx, 18, s.accent[4]);
  }
  if (kind === "merchant") {
    p.rect(cx - 4, 18, 9, 1, mix(s.cloth[0], outline, 0.3));
    // satchel on the right hip + strap
    for (let i = 0; i < 6; i++) p.px(cx - 3 + i, 13 + i, s.accent[1]);
    p.rect(cx + 3, 19, 4, 4, outline);
    p.rect(cx + 4, 20, 3, 3, s.accent[2]);
    p.rect(cx + 4, 20, 3, 1, s.accent[3]);
  }
  if (kind === "runner") {
    // neon seam down the coat
    p.rect(cx, 14, 1, 13, s.accent[2], 0.9);
    p.px(cx, 15, s.accent[4]);
  }

  /* ----------------------------------- arms ----------------------------------- */
  if (kind === "warrior") {
    // left arm forward (walking), right arm back
    p.rect(cx - 7, 15, 3, 5, outline);
    p.rect(cx - 6, 15, 2, 4, s.cloth[1]);
    p.rect(cx + 4, 14, 3, 5, outline);
    p.rect(cx + 5, 14, 2, 4, s.cloth[2]);
    p.rect(cx - 6, 19, 2, 2, s.skin[2]); // hand
    p.rect(cx + 5, 18, 2, 2, s.skin[2]);
  } else if (kind === "mage" || kind === "pilgrim") {
    // left arm holds the staff
    p.rect(cx - 7, 14, 3, 6, outline);
    p.rect(cx - 6, 14, 2, 5, s.cloth[1]);
    p.rect(cx + 5, 15, 2, 5, outline);
    p.rect(cx + 5, 15, 1, 4, s.cloth[2]);
  } else if (kind === "runner") {
    // right arm raised holding the umbrella shaft
    p.rect(cx + 4, 11, 3, 4, outline);
    p.rect(cx + 5, 11, 2, 3, s.cloth[2]);
    p.rect(cx + 5, 9, 2, 2, s.skin[2]); // hand
    p.rect(cx - 6, 15, 2, 5, outline);
    p.rect(cx - 6, 15, 1, 4, s.cloth[1]);
  } else {
    p.rect(cx - 7, 14, 3, 5, outline);
    p.rect(cx - 6, 14, 2, 4, s.cloth[1]);
    p.rect(cx + 4, 14, 3, 5, outline);
    p.rect(cx + 5, 14, 2, 4, s.cloth[2]);
    p.rect(cx + 5, 18, 2, 2, s.skin[2]);
  }

  /* ----------------------------------- head ----------------------------------- */
  const hy = 7; // head center row
  const hr = 6;
  p.blob(cx, hy, hr + 1, outline);
  if (kind === "runner" || kind === "pilgrim") {
    // hood up: cloth ring framing the face
    p.blob(cx, hy, hr, s.cloth[1]);
    p.blob(cx + 1, hy - 1, hr - 1, s.cloth[2]);
    p.blob(cx, hy + 1, hr - 2, s.skin[2]); // face opening
    // hood shading
    p.blob(cx - 2, hy + 1, 2, s.cloth[0]);
  } else {
    p.blob(cx, hy, hr, s.skin[2]);
    // face shading: shade left, light right
    p.blob(cx - 2, hy + 1, 3, s.skin[1]);
    p.blob(cx + 3, hy - 2, 2, s.skin[3]);
    // hair cap
    hairStyle(p, kind, cx, hy, hr, s.hair);
  }

  // face: eyes + glints + blush + mouth
  const ey = hy + 1;
  p.rect(cx - 3, ey, 1, 2, outline);
  p.rect(cx + 2, ey, 1, 2, outline);
  p.px(cx - 3, ey, [240, 244, 252]);
  p.px(cx + 2, ey, [240, 244, 252]);
  p.px(cx - 4, ey + 2, hexToRgb("#E08A7A"), 0.7); // blush
  p.px(cx + 3, ey + 2, hexToRgb("#E08A7A"), 0.7);
  p.px(cx, ey + 3, s.skin[0]); // mouth shadow
  p.px(cx, ey + 3, mix(s.skin[1], outline, 0.4), 0.8);

  /* ----------------------------------- gear ----------------------------------- */
  if (kind === "warrior") {
    // headband
    p.rect(cx - 5, hy - 2, 10, 1, s.accent[2]);
    p.rect(cx - 5, hy - 2, 10, 1, s.accent[1], 0.4);
    p.px(cx + 5, hy - 2, s.accent[3]);
    // sword on the back: blade peeks over the right shoulder
    p.rect(cx + 6, hy - 6, 1, 8, outline);
    p.rect(cx + 6, hy - 6, 1, 7, [200, 210, 224]);
    p.px(cx + 6, hy - 6, [240, 246, 252]);
    p.rect(cx + 5, hy + 2, 3, 1, s.accent[1]); // guard
    p.rect(cx + 6, hy + 3, 1, 2, s.accent[0]); // grip
  }
  if (kind === "mage") {
    // wide-brim hat
    p.blob(cx, hy - 3, 4, outline);
    p.blob(cx + 1, hy - 4, 3, s.cloth[1]);
    p.rect(cx - 8, hy - 2, 17, 2, outline); // brim
    p.rect(cx - 7, hy - 2, 15, 1, s.cloth[2]);
    p.rect(cx + 2, hy - 2, 5, 1, s.cloth[3]); // brim light
    p.rect(cx - 5, hy - 1, 10, 1, s.accent[2]); // gold band
    // staff in the left hand, orb above
    p.rect(cx - 8, 3, 2, 22, outline);
    p.rect(cx - 8, 4, 1, 21, hexToRgb("#6A4A2E"));
    p.glow(cx - 7, 2, 5, s.accent[4], 4, 0.5);
    p.blob(cx - 7, 2, 2, s.accent[4]);
    p.px(cx - 7, 2, HOT);
    p.px(cx - 6, 1, HOT);
  }
  if (kind === "pilgrim") {
    // walking staff with a hanging lantern — the snow-scene light source
    p.rect(cx - 8, 2, 2, 24, outline);
    p.rect(cx - 8, 3, 1, 23, hexToRgb("#6A4A2E"));
    p.rect(cx - 8, 2, 2, 1, hexToRgb("#8A6A42"));
    // hook + lantern
    p.rect(cx - 8, 3, 3, 1, hexToRgb("#6A4A2E"));
    p.glow(cx - 5, 6, 5, s.accent[4], 4, 0.55);
    p.rect(cx - 6, 4, 2, 4, [26, 20, 28]);
    p.rect(cx - 6, 5, 2, 2, s.accent[2]);
    p.px(cx - 5, 5, HOT);
  }
  if (kind === "runner") {
    // umbrella: glowing canopy held high on the right
    const ux = cx + 6;
    p.rect(ux, 0, 1, 11, outline); // shaft
    p.px(ux, 0, s.accent[3]);
    p.blob(ux, 1, 7, outline);
    p.blob(ux, 1, 6, s.cloth[1]);
    p.blob(ux + 1, 0, 5, s.cloth[2]);
    // neon rim along the canopy bottom edge
    for (let gx = ux - 6; gx <= ux + 6; gx++) {
      const d = Math.abs(gx - ux);
      if (d >= 4 && d <= 6) p.px(gx, 2, s.accent[3]);
    }
    p.glow(ux, 1, 9, s.accent[2], 4, 0.28);
  }

  /* --------------------------------- rim light --------------------------------- */
  // warm rim on the sun-facing (right) edge of the whole sprite
  const img = p.ctx.getImageData(0, 0, CW * 2, CH * 2);
  const rim: RGB = kind === "runner" ? [120, 220, 235] : kind === "pilgrim" ? [190, 214, 248] : [255, 214, 150];
  for (let gy = 0; gy < CH; gy++) {
    for (let gx = CW - 2; gx > 0; gx--) {
      const i = (gy * CW + gx) * 4;
      const right = (gy * CW + gx + 1) * 4;
      if (img.data[i + 3] > 0 && img.data[right + 3] === 0) {
        p.px(gx, gy, rim, 0.5);
        break; // one rim cell per row
      }
    }
  }

  return { src: p.dataURL(), w: CW * 2, h: CH * 2 };
}

/** Hair silhouettes per archetype (cap + side locks + spikes). */
function hairStyle(p: Painter, kind: Archetype, cx: number, hy: number, hr: number, hair: RGB[]) {
  if (kind === "mage") return; // hidden under the hat
  const rng = p.rng;
  p.blob(cx, hy - 3, hr - 1, hair[1]); // cap
  p.blob(cx + 1, hy - 4, hr - 3, hair[2]);
  p.blob(cx + 2, hy - 5, 2, hair[3]); // crown light
  if (kind === "warrior") {
    // swept spikes
    for (let i = 0; i < 5; i++) {
      const sx = cx - 5 + i * 2;
      p.rect(sx, hy - 7 - (i % 2), 2, 3, hair[1]);
    }
    p.rect(cx + 3, hy - 8, 2, 2, hair[2]);
    // side locks
    p.rect(cx - 6, hy - 2, 2, 5, hair[1]);
    p.rect(cx + 4, hy - 2, 2, 4, hair[2]);
  } else if (kind === "merchant") {
    // neat short cut + fringe
    p.rect(cx - 5, hy - 1, 2, 3, hair[1]);
    p.rect(cx + 4, hy - 2, 1, 3, hair[1]);
    for (let i = 0; i < 4; i++) {
      if (rng() < 0.8) p.rect(cx - 3 + i * 2, hy - 1, 1, 1, hair[0]);
    }
    // feather cap
    p.blob(cx + 1, hy - 5, 3, rampAccent());
    p.px(cx + 3, hy - 7, [216, 90, 90]);
    p.px(cx + 4, hy - 8, [216, 90, 90]);
  }
}

function rampAccent(): RGB {
  return hexToRgb("#8C3A32");
}
