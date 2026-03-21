/**
 * Diagnose and fix Supabase storage bucket issues
 * Run: node scripts/fix-buckets.mjs
 */
import '../lib/loadEnv.js'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// ── 1. Check actual bucket status via signed URL vs public URL
console.log('── 1. Checking bucket public access ──')

const testFile = 'seed-campaign-healthcare-1772821732020.jpg'
const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/campaigns-images/${testFile}`

const res = await fetch(publicUrl)
const body400 = res.status === 400 ? await res.text() : ''
console.log(`Public URL (${res.status}): ${res.status !== 200 ? body400.substring(0, 100) : 'OK - image accessible'}`)

// Try signed URL
const { data: signedData, error: signErr } = await supabase.storage
  .from('campaigns-images')
  .createSignedUrl(testFile, 60)

if (signErr) {
  console.log('Signed URL error:', signErr.message)
} else {
  const signed = await fetch(signedData.signedUrl)
  console.log(`Signed URL (${signed.status}): ${signed.status === 200 ? 'OK - image accessible via signed URL' : 'Also fails'}`)
}

// ── 2. Try to update buckets to public using updateBucket
console.log('\n── 2. Attempting to make buckets public ──')
const bucketsToFix = ['campaigns-images', 'events-images', 'team-photos']

for (const bucket of bucketsToFix) {
  const { data, error } = await supabase.storage.updateBucket(bucket, { public: true })
  if (error) {
    console.log(`✗ ${bucket}: Cannot update → ${error.message}`)
  } else {
    console.log(`✓ ${bucket}: Updated to public`)
  }
}

// ── 3. Create partners-logos bucket
console.log('\n── 3. Creating partners-logos bucket ──')
const { data: createData, error: createError } = await supabase.storage.createBucket('partners-logos', {
  public: true,
  fileSizeLimit: 5242880,
  allowedMimeTypes: ['image/*']
})
if (createError) {
  console.log(`✗ Create partners-logos: ${createError.message}`)
  // Maybe it already exists, try updating it
  const { error: updateErr } = await supabase.storage.updateBucket('partners-logos', { public: true })
  if (updateErr) {
    console.log(`✗ Update partners-logos: ${updateErr.message}`)
  } else {
    console.log('✓ partners-logos updated to public')
  }
} else {
  console.log('✓ partners-logos created as public')
}

// ── 4. Verify public access again
console.log('\n── 4. Verifying public access after fix ──')
const res2 = await fetch(publicUrl)
console.log(`campaigns-images public URL: ${res2.status} ${res2.status === 200 ? '✓ ACCESSIBLE' : '✗ STILL FAILING'}`)
