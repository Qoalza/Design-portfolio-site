export function wrapSlideIndex(index, count) {
  if (count <= 0) return -1;
  return ((index % count) + count) % count;
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
