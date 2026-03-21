/**
 * Fix Supabase storage via direct PostgreSQL connection:
 * 1. Make all 5 buckets public
 * 2. Create RLS SELECT policies for anonymous read
 * 3. Create the partners-logos bucket if missing
 * Run: node scripts/fix-storage-sql.mjs
 */
import '../lib/loadEnv.js'
import pg from 'pg'

const { Client } = pg
const client = new Client({ connectionString: process.env.DATABASE_URL })

await client.connect()
console.log('✓ Connected to PostgreSQL')

// ── 1. Show current bucket state
console.log('\n── Current buckets ──')
const { rows: buckets } = await client.query(`
  SELECT id, name, public, created_at 
  FROM storage.buckets 
  ORDER BY created_at
`)
console.table(buckets)

// ── 2. Ensure all required buckets exist + are public
const requiredBuckets = [
  { id: 'campaigns-images',  name: 'campaigns-images' },
  { id: 'events-images',     name: 'events-images' },
  { id: 'team-photos',       name: 'team-photos' },
  { id: 'partners-logos',    name: 'partners-logos' },
  { id: 'receipts',          name: 'receipts' },
]

console.log('\n── Making buckets public & creating missing ones ──')
for (const b of requiredBuckets) {
  const exists = buckets.find(row => row.id === b.id)
  if (exists) {
    await client.query(
      `UPDATE storage.buckets SET public = true WHERE id = $1`,
      [b.id]
    )
    console.log(`✓ ${b.id}: set to public`)
  } else {
    await client.query(
      `INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
       VALUES ($1, $2, true, 5242880, ARRAY['image/jpeg','image/png','image/gif','image/webp','application/pdf'])`,
      [b.id, b.name]
    )
    console.log(`✓ ${b.id}: created as public`)
  }
}

// ── 3. Create storage SELECT policies for anonymous access
console.log('\n── Creating public SELECT policies ──')

// Drop existing anon select policies first to avoid conflicts
await client.query(`
  DELETE FROM storage.policies 
  WHERE name LIKE 'Public read%' OR name LIKE 'Anon read%' OR name LIKE 'Allow public%'
`).catch(() => {})

// Check how many policies already exist per bucket
const { rows: existingPolicies } = await client.query(`
  SELECT bucket_id, name, command FROM storage.policies ORDER BY bucket_id
`)
console.log('Existing policies:', existingPolicies.length)

// For each public bucket, ensure anonymous SELECT policy exists
const publicBuckets = ['campaigns-images', 'events-images', 'team-photos', 'partners-logos']

for (const bucketId of publicBuckets) {
  // Check if a SELECT policy already exists for this bucket
  const hasPol = existingPolicies.some(p => p.bucket_id === bucketId && p.command === 'SELECT')
  
  if (!hasPol) {
    try {
      await client.query(`
        INSERT INTO storage.policies (name, bucket_id, command, definition, check_expression)
        VALUES ($1, $2, 'SELECT', 'true', 'true')
      `, [`Public read ${bucketId}`, bucketId])
      console.log(`✓ SELECT policy created for ${bucketId}`)
    } catch (err) {
      // Try alternative policy table schema
      try {
        await client.query(`
          INSERT INTO storage.policies (name, bucket_id, command, definition)
          VALUES ($1, $2, 'SELECT', 'true')
        `, [`Public read ${bucketId}`, bucketId])
        console.log(`✓ SELECT policy created for ${bucketId} (alt schema)`)
      } catch (err2) {
        console.log(`⚠ Could not create SELECT policy for ${bucketId}: ${err2.message}`)
      }
    }
  } else {
    console.log(`- ${bucketId}: SELECT policy already exists`)
  }
}

// Also ensure INSERT policies exist (for backend uploads)
for (const bucketId of publicBuckets) {
  const hasPol = existingPolicies.some(p => p.bucket_id === bucketId && p.command === 'INSERT')
  
  if (!hasPol) {
    try {
      await client.query(`
        INSERT INTO storage.policies (name, bucket_id, command, definition, check_expression)
        VALUES ($1, $2, 'INSERT', 'true', 'true')
      `, [`Allow insert ${bucketId}`, bucketId])
      console.log(`✓ INSERT policy created for ${bucketId}`)
    } catch (err) {
      console.log(`⚠ Could not create INSERT policy for ${bucketId}: ${err.message}`)
    }
  }
}

// ── 4. Verify buckets are now public
console.log('\n── Final bucket state ──')
const { rows: finalBuckets } = await client.query(`
  SELECT id, name, public FROM storage.buckets ORDER BY name
`)
console.table(finalBuckets)

await client.end()
console.log('\n✅ Storage fix complete!')
