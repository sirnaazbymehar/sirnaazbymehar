// Server-only configuration. These values are read at runtime inside the Netlify Function
// and are never bundled into the website's JavaScript (nothing here starts with VITE_).
// Values come from the environment only: Netlify injects them in production and `netlify dev` reads .env
// locally. (No .env loader is imported here, so a .env file can never be packaged into the function.)

function required(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing environment variable ${name}. See .env.example / SETUP.md.`)
  return v
}

export const env = {
  /** Netlify sets CONTEXT=production for the live site. */
  isProd: process.env.CONTEXT === 'production' || process.env.NODE_ENV === 'production',
  get databaseUrl() { return required('DATABASE_URL') },
  /** Optional: Supabase's CA certificate (PEM) so the database certificate is fully verified. */
  databaseCaCert: process.env.DATABASE_CA_CERT?.replace(/\\n/g, '\n'),
  databaseSsl: process.env.DATABASE_SSL !== 'false',
  /** Public address of the site, e.g. https://www.sirnaazbymehar.com (used in password-reset links). */
  publicUrl: (process.env.PUBLIC_URL ?? process.env.URL ?? 'http://localhost:8888').replace(/\/$/, ''),
  supabase: {
    get url() { return required('SUPABASE_URL').replace(/\/$/, '') },
    get serviceRoleKey() { return required('SUPABASE_SERVICE_ROLE_KEY') },
    bucket: process.env.STORAGE_BUCKET ?? 'product-images',
  },
  mail: {
    resendApiKey: process.env.RESEND_API_KEY ?? '',
    from: process.env.MAIL_FROM ?? 'Sirnaaz by Mehar <onboarding@resend.dev>',
  },
  /** One-time secret that lets the owner create the FIRST admin from the browser. Ignored once an admin exists. */
  adminSetupToken: process.env.ADMIN_SETUP_TOKEN ?? '',
}

export const emailEnabled = () => env.mail.resendApiKey.length > 0
