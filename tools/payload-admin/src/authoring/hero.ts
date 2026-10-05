import { replaceValue, valueAt, type Value } from './model'

type ObjectValue = { [key: string]: Value }
export type HeroKind = 'layout' | 'raster'
const sceneSlots = [
 ['media-campaigns', 'Media Campaigns'], ['statistics', 'Statistics'],
 ['my-space', 'My Space'], ['authorization', 'Authorization'],
] as const
// Existing layout-four-scenes-v1 envelopes; the editor does not change shell geometry.
const adaptiveRanges = [
 { id: 'mobile', minWidth: 360, maxWidth: 600, presetWidth: 595.256245, height: 640 },
 { id: 'tablet', minWidth: 600, maxWidth: 1280, presetWidth: 1279, height: 1100 },
 { id: 'desktop', minWidth: 1280, maxWidth: 1160 / .6, presetWidth: 1599, height: 960 },
]
function object(value: unknown): ObjectValue {
 if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Данные редактора повреждены.')
 return value as ObjectValue
}
export function withoutEditorState(value: unknown): Record<string, unknown> {
 const copy = { ...object(value) }
 delete copy._payloadEditor
 return copy
}
export function editorState(value: unknown): ObjectValue | undefined {
 const state = object(value)._payloadEditor
 if (state === undefined) return undefined
 const result = object(state)
 if (result.version !== 1 || Object.keys(result).some(key => !['version', 'heroes', 'materials', 'packages'].includes(key))) throw new Error('Версия данных редактора не поддерживается.')
 const heroes = object(result.heroes)
 for (const [kind, hero] of Object.entries(heroes)) {
  if (!['layout', 'raster'].includes(kind) || object(hero).kind !== kind) throw new Error('Сохранённый вариант Hero повреждён.')
 }
 return result
}
export function withEditorState(document: unknown, source: unknown): ObjectValue {
 const state = editorState(source)
 return { ...object(document), ...(state ? { _payloadEditor: state } : {}) }
}
function emptyHero(kind: HeroKind): ObjectValue {
 if (kind === 'raster') return { kind, initialSlideId: '', slides: [] }
 return {
  kind, chromeProfile: 'layout-four-scenes-v1', initialSceneId: sceneSlots[0][0],
  adaptives: { enabled: ['desktop'] },
  scenes: sceneSlots.map(([id, title]) => ({ id, title, source: { kind: 'url', url: '' }, adaptives: adaptiveRanges.map(range => ({ ...range })) })),
 }
}
export function switchHero(document: Value, kind: HeroKind): Value {
 const current = object(valueAt(document, ['redesign', 'hero']))
 if (current.kind === kind) return document
 if (current.kind !== 'layout' && current.kind !== 'raster') throw new Error('Вариант Hero не поддерживается.')
 const oldState = editorState(document)
 const heroes = { ...(oldState ? object(oldState.heroes) : {}), [current.kind]: current }
 const selected = heroes[kind] || emptyHero(kind)
 const changed = object(replaceValue(document, ['redesign', 'hero'], selected))
 return { ...changed, _payloadEditor: { ...oldState, version: 1, heroes } }
}
