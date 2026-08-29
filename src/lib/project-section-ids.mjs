function headingBaseId(label) {
  return label
    .toLocaleLowerCase("ru")
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/gi, "-")
    .replace(/^-|-$/g, "") || "section";
}

export function createProjectSectionIds(headings) {
  const occurrences = new Map();

  return headings.map((heading) => {
    const base = headingBaseId(heading);
    const occurrence = (occurrences.get(base) ?? 0) + 1;
    occurrences.set(base, occurrence);
    return occurrence === 1 ? base : `${base}-${occurrence}`;
  });
}
