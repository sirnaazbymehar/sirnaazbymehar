// Safety check you can run any time: every table must have Row Level Security on,
// and Supabase's public API roles must hold no privileges on our tables.
//   npm run db:check
import { closePool, q } from '../db/pool'

const noRls = (await q(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity ORDER BY 1`)).rows
const grants = (await q(`SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants
                         WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated') ORDER BY 1, 2`)).rows
const pending = (await q(`SELECT count(*)::int AS n FROM schema_migrations`)).rows[0].n
console.log(noRls.length ? `✗ tables WITHOUT row level security: ${noRls.map((r) => r.tablename).join(', ')}` : '✓ row level security is on for every table')
console.log(grants.length ? `✗ public roles still have access: ${grants.map((g) => `${g.grantee}:${g.table_name}:${g.privilege_type}`).join(', ')}` : '✓ anon/authenticated roles have no table privileges')
console.log(`  migrations applied: ${pending}`)
await closePool()
if (noRls.length || grants.length) process.exit(1)
