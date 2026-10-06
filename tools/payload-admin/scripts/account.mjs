import { launchWriter } from './writer-process.mjs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { acquire, locations, appRoot } from './state.mjs'
import { requireCurrentSchema } from './schema.mjs'
import { backup } from './storage.mjs'
import { prompt } from './terminal-input.mjs'

async function main() {
  if (process.argv.length !== 2 || !process.stdin.isTTY || !process.stdout.isTTY) throw new Error('Запустите npm run account:recover в защищённом терминале. Не передавайте пароль аргументом или через pipe.')
  const state = locations()
  const lock = await acquire(state)
  try {
    await requireCurrentSchema(state.root)
    const email = await prompt('Email существующей учётной записи: ')
    const password = await prompt('Новый пароль (12–128 символов, ввод скрыт): ', { hidden: true })
    const confirmation = await prompt('Повторите пароль (ввод скрыт): ', { hidden: true })
    if (password !== confirmation || password.length < 12 || password.length > 128) throw new Error('Пароли должны совпадать и содержать от 12 до 128 символов. Ничего не изменено.')
    const id = await backup(state)
    const code = await launchWriter({lock,cwd:appRoot,execArgv:['--import','tsx'],entry:'scripts/account-worker.ts',stdio:['pipe','ignore','ignore'],input:JSON.stringify({email,password}),
      env:{...process.env,...(state.server?{PAYLOAD_DATA_ROOT:state.root,PAYLOAD_LOCAL_ROOT:''}:{PAYLOAD_LOCAL_ROOT:state.root}),PAYLOAD_SECRET:await readFile(path.join(state.root,'secret'),'utf8'),PAYLOAD_TEST_PUSH:'',NODE_ENV:'production'},
    })
    if (code !== 0) throw new Error('Восстановление не завершено. Проверьте email учётной записи; резервная копия сохранена.')
    console.log(`Пароль изменён, прежние сеансы завершены. Резервная копия: ${id}`)
  } finally { await lock.release() }
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
