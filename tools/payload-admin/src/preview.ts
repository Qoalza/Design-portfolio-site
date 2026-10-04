import type { Payload } from 'payload'
import type { User } from './payload-types'

export async function readPreviewProject(payload: Payload, user: User | null, id: string, mode: string) {
  if (!user) throw new Error('Preview requires authentication')
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) return null
  const result = await payload.find({
    collection: 'projects', user, overrideAccess: false,
    draft: mode !== 'published', depth: 1, limit: 1,
    where: mode === 'published'
      ? { and: [{ id: { equals: Number(id) } }, { _status: { equals: 'published' } }] }
      : { id: { equals: Number(id) } },
  })
  return result.docs[0] ?? null
}
