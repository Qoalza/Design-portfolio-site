import type { Payload } from 'payload'

export async function resetLocalAccount(payload: Payload, email: string, password: string) {
  if (typeof email !== 'string' || !email.trim()) throw new Error('Укажите email существующей учётной записи.')
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) throw new Error('Пароль должен содержать от 12 до 128 символов.')
  const result = await payload.find({ collection: 'users', overrideAccess: true, limit: 2, where: { email: { equals: email.trim().toLowerCase() } } })
  if (result.totalDocs !== 1) throw new Error('Учётная запись не найдена.')
  await payload.update({
    collection: 'users', id: result.docs[0].id, overrideAccess: true,
    data: { password, sessions: [], loginAttempts: 0, lockUntil: null, resetPasswordToken: null, resetPasswordExpiration: null },
  })
}
