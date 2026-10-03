import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool, closePool } from './pool'

const dir = join(dirname(fileURLToPath(import.meta.url)), 'migrations')

// Applied by a person, once per change — never by the website while it is running.
//   npm run db:migrate   (uses DATABASE_URL from .env)
// For a brand-new Supabase project the simplest route is supabase/setup.sql in the SQL Editor (see SETUP.md).
export async function migrate() {
  await pool().query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())')
  const done = new Set((await pool().query('SELECT name FROM schema_migrations')).rows.map((r) => r.name))
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    if (done.has(file)) continue
    const c = await pool().connect()
    try {
      await c.query('BEGIN')
      await c.query(readFileSync(join(dir, file), 'utf8'))
      await c.query('INSERT INTO schema_migrations(name) VALUES ($1)', [file])
      await c.query('COMMIT')
      console.log(`✓ migration ${file}`)
    } catch (e) {
      await c.query('ROLLBACK'); throw e
    } finally { c.release() }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  migrate().then(() => closePool()).catch((e) => { console.error(e); process.exit(1) })
}
