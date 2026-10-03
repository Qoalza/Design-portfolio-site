export function wrapSlideIndex(index, count) {
  if (count <= 0) return -1;
  return ((index % count) + count) % count;
}

const NEAR_SCALE = 640 / 940;
const FAR_SCALE = .55;
const NEAR_X = 260;
const FAR_X = 382;
const CARD_WIDTH = 940;
const CENTER_HALF_WIDTH = CARD_WIDTH / 2;
const NEAR_WIDTH = CARD_WIDTH * NEAR_SCALE;

export function carouselCardLayer(slot, showFive, departing = false) {
  if (departing) return 4;
  const distance = Math.abs(slot);
  return distance === 0 ? 3 : distance === 1 ? 2 : showFive && distance === 2 ? 1 : 0;
}

export function carouselOutgoingClip(x, showFive) {
  const distance = showFive ? NEAR_X : 320;
  const exposed = distance + NEAR_WIDTH / 2 - CENTER_HALF_WIDTH;
  const progress = Math.min(1, Math.abs(x) / distance);
  const width = CARD_WIDTH + (NEAR_WIDTH - CARD_WIDTH) * progress;
  const visible = CARD_WIDTH + (exposed - CARD_WIDTH) * progress;
  const inset = 100 * (1 - visible / width);
  return {left: x > 0 ? inset : 0, right: x < 0 ? inset : 0};
}

export function carouselIncomingClip(x, showFive) {
  const distance = showFive ? NEAR_X : 320;
  const position = Math.min(distance, Math.abs(x));
  const progress = 1 - position / distance;
  const width = NEAR_WIDTH + (CARD_WIDTH - NEAR_WIDTH) * progress;
  const seam = CENTER_HALF_WIDTH - CARD_WIDTH * progress;
  const inset = 100 * (seam - position + width / 2) / width;
  return {left: x > 0 ? inset : 0, right: x < 0 ? inset : 0};
}

export function carouselClipPath({left, right}) {
  return `inset(0 ${right}% 0 ${left}% round 16px)`;
}

export function nextCarouselStep(step, target) {
  return step + Math.sign(target - step);
}

export function carouselShadeStops(x) {
  // The far card exposes 60px instead of 110px. Scale the same visible
  // gradient segment into its local frame, then interpolate as the card moves.
  const near = {start: -41, end: 241};
  const farFactor = (60 / 110) * (NEAR_SCALE / FAR_SCALE);
  const progress = Math.max(0, Math.min(1, (Math.abs(x) - NEAR_X) / (FAR_X - NEAR_X)));
  return {
    start: near.start * (1 + (farFactor - 1) * progress),
    end: near.end * (1 + (farFactor - 1) * progress),
  };
}

export function carouselSlotVisual(slot, showFive) {
  const distance = Math.abs(slot);
  return {
    x: slot === 0 ? 0 : Math.sign(slot) * (distance === 1 ? (showFive ? NEAR_X : 320) : showFive && distance === 2 ? FAR_X : 650),
    y: slot === 0 ? 0 : -20,
    scale: distance === 0 ? 1 : distance === 1 ? NEAR_SCALE : showFive && distance === 2 ? FAR_SCALE : .5,
    opacity: distance <= 1 || showFive && distance === 2 ? 1 : 0,
  };
}

export function carouselCards(slides, step) {
  if (slides.length === 0) return [];
  if (slides.length === 1) return [{key: step, slide: slides[0], slot: 0}];
  if (slides.length === 2) {
    const activeIndex = wrapSlideIndex(step, 2);
    return slides.map((slide, index) => ({
      key: `slide-${index}`,
      slide,
      slot: index === activeIndex ? 0 : activeIndex === 0 ? 1 : -1,
    }));
  }

  const slots = slides.length >= 5 ? [-3, -2, -1, 0, 1, 2, 3] : [-2, -1, 0, 1, 2];
  return slots.map(slot => {
    const key = step + slot;
    return {key, slide: slides[wrapSlideIndex(key, slides.length)], slot};
  });
}

export function visibleDotIndexes(activeIndex, count) {
  if (count <= 0) return [];
  if (count <= 5) return Array.from({length: count}, (_, index) => index);
  return Array.from({length: 5}, (_, index) => wrapSlideIndex(activeIndex + index - 2, count));
}

export function carouselDotItems(slides, step) {
  const count = slides.length;
  if (count <= 5) {
    return slides.map((_, index) => ({
      key: `slide-${index}`,
      index,
      slot: index - (count - 1) / 2,
      visible: true,
      compact: count === 5 && (index === 0 || index === 4),
    }));
  }

  // Keep one invisible dot on either side so the same keyed dot can enter
  // the five-position window instead of being replaced in place.
  return [-3, -2, -1, 0, 1, 2, 3].map(slot => ({
    key: step + slot,
    index: wrapSlideIndex(step + slot, count),
    slot,
    visible: Math.abs(slot) <= 2,
    compact: Math.abs(slot) === 2,
  }));
}

export function nearestCarouselStep(step, targetIndex, count) {
  if (count <= 0) return step;
  const currentIndex = wrapSlideIndex(step, count);
  const forward = wrapSlideIndex(targetIndex - currentIndex, count);
  const backward = forward - count;
  return step + (forward <= -backward ? forward : backward);
}
