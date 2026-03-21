import { supabase } from '../config/supabase.js'

// Verify storage is accessible by doing a quick probe upload
export const initializeStorageBuckets = async () => {
  const BUCKETS = [
    process.env.CAMPAIGNS_BUCKET || 'campaigns-images',
    process.env.EVENTS_BUCKET    || 'events-images',
    process.env.TEAM_BUCKET      || 'team-photos',
    process.env.PARTNERS_BUCKET  || 'partners-logos',
    process.env.HERO_SLIDES_BUCKET || 'hero-slides',
  ]

  let ok = 0
  const probe = Buffer.from([0xff, 0xd8, 0xff, 0xd9]) // minimal JPEG

  for (const bucket of BUCKETS) {
    const { error } = await supabase.storage
      .from(bucket)
      .upload('_probe.jpg', probe, { contentType: 'image/jpeg', upsert: true })
    if (!error) {
      await supabase.storage.from(bucket).remove(['_probe.jpg'])
      ok++
    } else {
      console.warn(`⚠  Storage bucket "${bucket}" not accessible: ${error.message}`)
    }
  }

  console.log(`✅ Storage ready: ${ok}/${BUCKETS.length} buckets accessible`)
}

// Get bucket configuration
export const getBucketConfig = (bucketType) => {
  const configs = {
    campaigns: process.env.CAMPAIGNS_BUCKET || 'campaigns-images',
    events: process.env.EVENTS_BUCKET || 'events-images',
    team: process.env.TEAM_BUCKET || 'team-photos',
    partners: process.env.PARTNERS_BUCKET || 'partners-logos',
    donations: process.env.DONATIONS_BUCKET || 'receipts',
    heroSlides: process.env.HERO_SLIDES_BUCKET || 'hero-slides'
  }

  return configs[bucketType] || configs.campaigns
}