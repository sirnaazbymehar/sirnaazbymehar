// Create (or reset the password of) an admin user. Credentials never live in the code.
//   ADMIN_PASSWORD='a long passphrase' npm run create-admin -- owner@example.com "Mehar"
import { closePool, q } from '../db/pool'
import { hashPassword } from '../lib/auth'

const [email, name = 'Admin'] = process.argv.slice(2)
const password = process.env.ADMIN_PASSWORD
if (!email || !password) {
  console.error('Usage: ADMIN_PASSWORD="…" npm run create-admin -- <email> "<name>"')
  process.exit(1)
}
if (password.length < 12) { console.error('Use an admin password of at least 12 characters.'); process.exit(1) }

await q(`INSERT INTO admin_users (email, name, password_hash) VALUES ($1,$2,$3)
                  ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name, is_active = true`,
  [email.trim().toLowerCase(), name, await hashPassword(password)])
await q('DELETE FROM sessions WHERE admin_id = (SELECT id FROM admin_users WHERE email = $1)', [email.trim().toLowerCase()])
console.log(`✓ admin ${email} is ready`)
await closePool()
