import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { resetLocalAccount } from '../scripts/reset-account'

const payload = await getPayload({ config })
try {
  const email = 'recovery@example.test'
  const oldPassword = randomBytes(32).toString('hex')
  const newPassword = randomBytes(32).toString('hex')
  const user = await payload.create({ collection: 'users', data: { email, password: oldPassword } })
  const oldLogin = await payload.login({ collection: 'users', data: { email, password: oldPassword } })
  assert.ok(oldLogin.token)
  const headers = new Headers({ Authorization: `JWT ${oldLogin.token}` })
  assert.ok((await payload.auth({ headers })).user)
  await payload.update({ collection: 'users', id: user.id, data: { loginAttempts: 10, lockUntil: new Date(Date.now() + 3600000).toISOString(), resetPasswordToken: 'fixture-token', resetPasswordExpiration: new Date(Date.now() + 3600000).toISOString() } })
  await assert.rejects(resetLocalAccount(payload, email, 'short'))
  await assert.rejects(resetLocalAccount(payload, 'missing@example.test', newPassword))
  await resetLocalAccount(payload, email, newPassword)
  assert.equal((await payload.auth({ headers })).user, null)
  await assert.rejects(payload.login({ collection: 'users', data: { email, password: oldPassword } }))
  assert.ok((await payload.login({ collection: 'users', data: { email, password: newPassword } })).token)
  const changed = await payload.findByID({ collection: 'users', id: user.id, showHiddenFields: true })
  assert.equal(changed.resetPasswordToken, null)
  assert.equal(changed.lockUntil, null)
  assert.equal(changed.loginAttempts, 0)
  console.log('PASS: восстановление пароля снимает блокировку, отзывает старую сессию/пароль и сброс по старому токену')
} finally { await payload.destroy() }
