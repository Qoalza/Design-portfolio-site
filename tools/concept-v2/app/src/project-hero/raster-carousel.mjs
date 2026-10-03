export function wrapSlideIndex(index, count) {
  if (count <= 0) return -1;
  return ((index % count) + count) % count;
}

export function carouselCards(slides, step) {
  if (slides.length === 0) return [];
  if (slides.length === 1) return [{key: step, slide: slides[0], slot: 0}];

  return [-2, -1, 0, 1, 2].map(slot => {
    const key = step + slot;
    return {key, slide: slides[wrapSlideIndex(key, slides.length)], slot};
  });
}

export function nearestCarouselStep(step, targetIndex, count) {
  if (count <= 0) return step;
  const currentIndex = wrapSlideIndex(step, count);
  const forward = wrapSlideIndex(targetIndex - currentIndex, count);
  const backward = forward - count;
  return step + (forward <= -backward ? forward : backward);
}
