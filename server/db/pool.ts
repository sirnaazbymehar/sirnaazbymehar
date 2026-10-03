import pg from 'pg'
import { env } from '../env'

// Return TIMESTAMPTZ as ISO strings and BIGINT counts as numbers.
pg.types.setTypeParser(1184, (v) => new Date(v).toISOString())
pg.types.setTypeParser(20, (v) => Number(v))

// Serverless-friendly pool: each function instance keeps at most a couple of connections and lets them go
// quickly. In production DATABASE_URL points at Supabase's connection pooler (transaction mode, port 6543),
// which shares a small number of real database connections between all function instances.
// node-postgres only uses unnamed prepared statements, which the transaction pooler supports.
let _pool: pg.Pool | null = null
export function pool() {
  _pool ??= new pg.Pool({
    connectionString: env.databaseUrl,
    ssl: env.databaseSsl
      ? env.databaseCaCert
        ? { ca: env.databaseCaCert, rejectUnauthorized: true } // full verification (recommended)
        : { rejectUnauthorized: false } // encrypted; certificate not verified
      : undefined,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: true,
  })
  return _pool
}

export const q = <T extends pg.QueryResultRow = any>(text: string, params: unknown[] = []) => pool().query<T>(text, params)

/** Run fn inside a transaction; rolls back on any thrown error. */
export async function tx<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await pool().connect()
  try {
    await c.query('BEGIN')
    const out = await fn(c)
    await c.query('COMMIT')
    return out
  } catch (e) {
    await c.query('ROLLBACK').catch(() => {})
    throw e
  } finally {
    c.release()
  }
}

export async function closePool() { await _pool?.end(); _pool = null }

/** Errors that mean "database unreachable / overloaded" rather than a bug. */
export function isDbUnavailable(e: unknown) {
  const code = (e as { code?: string })?.code ?? ''
  const msg = String((e as Error)?.message ?? '')
  return ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', '57P01', '57P03', '53300', '08006', '08001', '08004'].includes(code)
    || /timeout exceeded when trying to connect|Connection terminated|connect ETIMEDOUT/i.test(msg)
}
