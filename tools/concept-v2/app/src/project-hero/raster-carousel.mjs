export function wrapSlideIndex(index, count) {
  if (count <= 0) return -1;
  return ((index % count) + count) % count;
}

export function carouselSlotVisual(slot, showFive) {
  const distance = Math.abs(slot);
  return {
    x: slot === 0 ? 0 : Math.sign(slot) * (distance === 1 ? (showFive ? 260 : 320) : showFive && distance === 2 ? 382 : 650),
    y: slot === 0 ? 0 : -20,
    scale: distance === 0 ? 1 : distance === 1 ? 640 / 940 : showFive && distance === 2 ? .55 : .5,
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
