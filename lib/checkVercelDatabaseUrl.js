/**
 * Warn on misconfiguration: Vercel cannot reliably use Supabase direct DB (:5432).
 * @see https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler
 */
export function warnIfVercelNeedsPooler() {
  if (process.env.VERCEL !== '1' && process.env.VERCEL !== 'true') return

  const url = process.env.DATABASE_URL || ''
  if (!url) return

  const isDirectSupabaseHost =
    url.includes('@db.') && url.includes('.supabase.co') && url.includes(':5432')
  const looksLikePooler =
    url.includes('pooler.supabase.com') || url.includes(':6543') || url.includes('pgbouncer=true')

  if (isDirectSupabaseHost && !looksLikePooler) {
    console.error(
      '\n========== DATABASE_URL misconfiguration (Vercel) ==========\n' +
        'Prisma uses DATABASE_URL. On Vercel you MUST NOT use the direct host\n' +
        'db.<project>.supabase.co:5432 — it returns "Can\'t reach database server".\n\n' +
        'Fix: Supabase Dashboard → Project Settings → Database → Connection string\n' +
        '     → Tab "Transaction pooler" → URI → copy into Vercel DATABASE_URL\n' +
        '     (host like aws-0-*.pooler.supabase.com, port 6543, add ?pgbouncer=true if shown).\n' +
        'Keep DIRECT_URL in Vercel as the direct :5432 string for migrations only, or set only locally.\n' +
        'Docs: ../DEPLOYMENT.md#vercel--supabase-database_url-required-difference\n' +
        '============================================================\n'
    )
  }
}
