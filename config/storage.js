import { supabase } from '../config/supabase.js'

// Create storage buckets for the application
export const initializeStorageBuckets = async () => {
  try {
    const buckets = [
      {
        name: process.env.CAMPAIGNS_BUCKET || 'campaigns-images',
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/*']
      },
      {
        name: process.env.EVENTS_BUCKET || 'events-images',
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/*']
      },
      {
        name: process.env.TEAM_BUCKET || 'team-photos',
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/*']
      },
      {
        name: process.env.DONATIONS_BUCKET || 'receipts',
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf', 'image/*']
      }
    ]

    console.log('Initializing storage buckets...')
    
    for (const bucket of buckets) {
      // Check if bucket exists
      const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets()
      
      if (listError) {
        console.error(`Error listing buckets: ${listError.message}`)
        continue
      }

      const bucketExists = existingBuckets.some(b => b.name === bucket.name)
      
      if (!bucketExists) {
        // Create bucket
        const { error: createError } = await supabase.storage.createBucket(bucket.name, {
          public: bucket.public,
          fileSizeLimit: bucket.fileSizeLimit,
          allowedMimeTypes: bucket.allowedMimeTypes
        })

        if (createError) {
          console.error(`Error creating bucket ${bucket.name}: ${createError.message}`)
        } else {
          console.log(`✅ Created bucket: ${bucket.name}`)
        }
      } else {
        console.log(`✅ Bucket already exists: ${bucket.name}`)
      }
    }

    console.log('Storage buckets initialization completed!')
  } catch (error) {
    console.error('Error initializing storage buckets:', error)
  }
}

// Get bucket configuration
export const getBucketConfig = (bucketType) => {
  const configs = {
    campaigns: process.env.CAMPAIGNS_BUCKET || 'campaigns-images',
    events: process.env.EVENTS_BUCKET || 'events-images',
    team: process.env.TEAM_BUCKET || 'team-photos',
    donations: process.env.DONATIONS_BUCKET || 'receipts'
  }

  return configs[bucketType] || configs.campaigns
}