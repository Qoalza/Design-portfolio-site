import {
  ADAPTIVE_PRESETS,
  MAX_DISPLAY_WIDTH,
  MIN_DISPLAY_WIDTH,
  RESPONSIVE_HERO_SCALE,
} from './width.mjs';

export const MAGNETIC_SNAP_RADIUS = 16;
export const INERTIA_VELOCITY_THRESHOLD = 180;
export const INERTIA_SAMPLE_MAX_AGE = 80;
export const INERTIA_MAX_OFFSET = 160;
export const GESTURE_VELOCITY_WINDOW = 120;
export const BOUNDARY_RECOIL_DISTANCE = 28;
const INERTIA_PROJECTION = .12;

export const DRAG_SPRING = {
  type: "spring",
  stiffness: 700,
  damping: 48,
  mass: .35,
  restDelta: .1,
  restSpeed: 1,
};

export const PRESET_TRANSITION = {
  type: "tween",
  duration: .5,
  ease: [.65, 0, .35, 1],
};

export const MAGNETIC_TRANSITION = {
  type: "tween",
  duration: .2,
  ease: [.22, 1, .36, 1],
};

export const INERTIA_TRANSITION = {
  type: "tween",
  duration: .42,
  ease: [.22, 1, .36, 1],
};

export const BOUNDARY_RECOIL_TRANSITION = {
  duration: .46,
  times: [0, .34, 1],
  ease: [[.22, 1, .36, 1], [.65, 0, .35, 1]],
};

export function getInertiaOffset(velocity, sampleAge) {
  if (!Number.isFinite(velocity) || !Number.isFinite(sampleAge)) return 0;
  if (sampleAge > INERTIA_SAMPLE_MAX_AGE) return 0;

  const speed = Math.abs(velocity);
  if (speed < INERTIA_VELOCITY_THRESHOLD) return 0;

  const projectedOffset = (speed - INERTIA_VELOCITY_THRESHOLD) * INERTIA_PROJECTION;
  return Math.sign(velocity) * Math.min(projectedOffset, INERTIA_MAX_OFFSET);
}

export function getGestureVelocity(samples, releaseTime) {
  const recentSamples = samples.filter(({ position, time }) => (
    Number.isFinite(position)
    && Number.isFinite(time)
    && time <= releaseTime
    && time >= releaseTime - GESTURE_VELOCITY_WINDOW
  ));
  if (recentSamples.length < 2) return 0;

  const first = recentSamples[0];
  const last = recentSamples[recentSamples.length - 1];
  const elapsed = last.time - first.time;
  if (elapsed <= 0) return 0;

  return ((last.position - first.position) / elapsed) * 1000;
}

export function getBoundaryRecoil(displayWidth, inertiaOffset) {
  const atMinimum = displayWidth <= MIN_DISPLAY_WIDTH + .5 && inertiaOffset < 0;
  const atMaximum = displayWidth >= MAX_DISPLAY_WIDTH - .5 && inertiaOffset > 0;
  if (!atMinimum && !atMaximum) return null;

  const displayRecoil = displayWidth - Math.sign(inertiaOffset) * BOUNDARY_RECOIL_DISTANCE;
  return {
    displayWidth: displayRecoil,
    logicalWidth: displayRecoil / RESPONSIVE_HERO_SCALE,
  };
}

export function getMagneticPreset(displayWidth) {
  let closest = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const preset of Object.values(ADAPTIVE_PRESETS)) {
    const distance = Math.abs(preset.displayWidth - displayWidth);
    if (distance <= MAGNETIC_SNAP_RADIUS && distance < closestDistance) {
      closest = preset.id;
      closestDistance = distance;
    }
  }

  return closest;
}
