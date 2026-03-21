import '../lib/loadEnv.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const campaign = await prisma.campaign.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' }
  })

  if (!campaign) {
    console.error('No active campaign found. Create a campaign first.')
    process.exit(1)
  }

  const baseSlug = 'community-event-2-april-2026'
  let slug = baseSlug
  let n = 0
  while (await prisma.event.findUnique({ where: { slug } })) {
    n += 1
    slug = `${baseSlug}-${n}`
  }

  const event = await prisma.event.create({
    data: {
      title: 'Community Event — 2 April',
      slug,
      description:
        'A foundation-led community programme linked to our campaign. All are welcome; registration is open.',
      eventDate: new Date('2026-04-02T10:00:00+05:30'),
      location: campaign.location || 'India',
      isActive: true,
      registrationEnabled: true,
      registrationFee: 0,
      campaignId: campaign.id,
      content: {
        about: [
          'This event is part of our ongoing work under the linked campaign. Join us for sessions, networking, and community impact.',
          'Please register so we can plan seating and materials.'
        ],
        keyAchievements: ['Campaign-aligned outreach', 'Community participation'],
        journey: [],
        speakers: [],
        agenda: [
          { time: '10:00 AM', title: 'Welcome & overview', description: 'Introduction to the programme' },
          { time: '11:30 AM', title: 'Main session', description: 'Activities and engagement' }
        ]
      }
    }
  })

  console.log('Created event:', event.title)
  console.log('  id:', event.id)
  console.log('  slug:', event.slug)
  console.log('  eventDate:', event.eventDate.toISOString())
  console.log('  campaign:', campaign.title, `(${campaign.id})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
