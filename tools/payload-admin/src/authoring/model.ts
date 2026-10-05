export type Value = null | boolean | number | string | Value[] | { [key: string]: Value }
export type ValuePath = readonly (string | number)[]
const forbidden = new Set(['__proto__', 'prototype', 'constructor'])

function child(value: unknown, key: string | number): unknown {
 if (!value || typeof value !== 'object' || forbidden.has(String(key))) throw new Error('Недопустимый путь поля.')
 if (Array.isArray(value)) {
  if (typeof key !== 'number' || !Number.isInteger(key) || key < 0 || key >= value.length) throw new Error('Элемент не найден.')
  return value[key]
 }
 if (typeof key !== 'string' || !Object.hasOwn(value, key)) throw new Error('Поле не найдено.')
 return (value as Record<string, unknown>)[key]
}
export function valueAt(value: unknown, path: ValuePath): unknown {
 return path.reduce<unknown>((current, key) => child(current, key), value)
}
// Clone only the edited branch; previously saved values and package metadata remain untouched.
export function replaceValue<T>(document: T, path: ValuePath, replacement: unknown): T {
 if (!path.length) return replacement as T
 const [key, ...rest] = path
 const previous = child(document, key)
 const next = rest.length ? replaceValue(previous, rest, replacement) : replacement
 if (Array.isArray(document)) {
  const copy = [...document]
  copy[key as number] = next
  return copy as T
 }
 return { ...document, [key]: next }
}
export function moveItem<T>(document: T, path: ValuePath, from: number, to: number): T {
 const items = valueAt(document, path)
 if (!Array.isArray(items)) throw new Error('Список не найден.')
 child(items, from); child(items, to)
 const copy = [...items]
 const [item] = copy.splice(from, 1)
 copy.splice(to, 0, item)
 return replaceValue(document, path, copy)
}
export function removeSlide<T extends { kind: string; initialSlideId: string; slides: { id: string }[] }>(hero: T, index: number): T {
 if (hero.kind !== 'raster' || hero.slides.length < 2) throw new Error('Нельзя удалить последний экран.')
 const selected = child(hero.slides, index) as { id: string }
 const slides = hero.slides.filter((_, at) => at !== index)
 return { ...hero, slides, initialSlideId: selected.id === hero.initialSlideId ? slides[Math.min(index, slides.length - 1)].id : hero.initialSlideId }
}
