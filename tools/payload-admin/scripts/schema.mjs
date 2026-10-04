import { DatabaseSync } from 'node:sqlite'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { appRoot, regular } from './state.mjs'

function normalizeSQL(sql) {
  // Ignore formatting and identifier quoting, preserve string literal contents.
  return (sql?.match(/'(?:''|[^'])*'|"(?:""|[^"])*"|`[^`]*`|\[[^\]]*\]|[a-zA-Z_][a-zA-Z_0-9]*|[0-9]+(?:\.[0-9]+)?|[^\s]/g) || []).map(token => {
    if (token.startsWith("'")) return token
    if (/^["`\[]/.test(token)) return token.slice(1, -1).toLowerCase()
    return token.toLowerCase()
  })
}

function namedTableDefinition(tokens) {
  if (tokens[0] !== 'create' || tokens[1] !== 'table') return tokens
  const start = tokens.indexOf('(')
  if (start < 0) return tokens
  let depth = 0, end = start, part = [], parts = []
  for (let i = start + 1; i < tokens.length; i++) {
    const token = tokens[i]
    if (token === '(') depth++
    if (token === ')' && depth === 0) { parts.push(part); end = i; break }
    if (token === ')') depth--
    if (token === ',' && depth === 0) { parts.push(part); part = [] } else part.push(token)
  }
  parts.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
  return [...tokens.slice(0, start + 1), ...parts.flatMap((part, i) => i ? [',', ...part] : part), ...tokens.slice(end)]
}
export async function schemaHash(root, { legacy = false } = {}) {
  const file = path.join(root, 'cms.db')
  await regular(root, 'directory')
  await regular(file)
  const db = new DatabaseSync(file, { readOnly: true })
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all()
    const result = tables.map(({ name }) => {
      const columns = db.prepare('SELECT name, type, "notnull", dflt_value, pk FROM pragma_table_info(?)').all(name)
      const fks = db.prepare('SELECT "table", "from", "to", on_update, on_delete FROM pragma_foreign_key_list(?) ORDER BY "from", "to"').all(name)
      const indices = db.prepare('SELECT name, "unique", origin, partial FROM pragma_index_list(?) ORDER BY name').all(name)
        .map(index => ({ ...index, columns: db.prepare('SELECT name, desc, coll, key FROM pragma_index_xinfo(?) ORDER BY seqno').all(index.name) }))
      return { name, columns, fks, indices }
    })
    const definitions = db.prepare("SELECT type,name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").all()
      .map(row => ({ ...row, sql: normalizeSQL(row.sql) }))
    const previous = createHash('sha256').update(JSON.stringify({ result, definitions })).digest('hex')
    if (legacy) return previous
    const contract = await schemaContract()
    if (contract.history.some(item => !item.algorithm && item.hash === previous)) return previous
    // Payload accesses columns by name. ALTER ADD and fresh CREATE differ only in
    // physical column order; retain defaults, keys, indices, constraints and triggers.
    const named = result.map(table => ({ ...table, columns: [...table.columns].sort((a, b) => a.name.localeCompare(b.name)) }))
    const normalized = definitions.map(item => ({ ...item, sql: item.type === 'table' ? namedTableDefinition(item.sql) : item.sql }))
    return createHash('sha256').update(JSON.stringify({ result: named, definitions: normalized })).digest('hex')
  } finally { db.close() }
}
export async function schemaContract() {
  return JSON.parse(await readFile(path.join(appRoot, 'scripts/schema-history.json'), 'utf8'))
}
export async function requireCurrentSchema(root) {
  const contract = await schemaContract()
  if (await schemaHash(root) !== contract.current) throw new Error('Структура базы не соответствует этой версии админки. Остановите её и выполните npm run db:prepare; данные не изменены.')
}
