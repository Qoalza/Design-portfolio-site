export async function prompt(label, { hidden = false } = {}) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('Для восстановления нужен интерактивный локальный терминал.')
  process.stdin.setEncoding('utf8')
  process.stdin.setRawMode(true)
  process.stdin.resume()
  return new Promise((resolve, reject) => {
    let text = ''
    const finish = error => {
      process.stdin.removeListener('data', onData)
      process.removeListener('SIGTERM', onTerminate)
      process.stdin.setRawMode(false)
      process.stdin.pause()
      process.stdout.write('\n')
      if (error) reject(error); else resolve(text)
    }
    const onTerminate = () => finish(new Error('Ввод отменён.'))
    const onData = chunk => {
      for (const char of chunk) {
        if (char === '\u0003' || char === '\u0004') { finish(new Error('Ввод отменён.')); return }
        if (char === '\r' || char === '\n') { finish(); return }
        if (char === '\u007f' || char === '\b') {
          if (text.length) { text = [...text].slice(0, -1).join(''); if (!hidden) process.stdout.write('\b \b') }
        } else if (char >= ' ' && text.length < 256) { text += char; if (!hidden) process.stdout.write(char) }
      }
    }
    process.once('SIGTERM', onTerminate)
    process.stdin.on('data', onData)
    // Install raw input before showing the prompt: fast paste must never echo.
    process.stdout.write(label)
  })
}
