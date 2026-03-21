import '../lib/loadEnv.js'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const campaigns = await prisma.campaign.findMany({
  where: { slug: { in: ['rural-healthcare-outreach-nashik','clean-water-vidarbha','girls-education-pune','farmers-livelihood-marathwada'] }},
  include: { events: { select: { title: true, location: true, eventDate: true, imageUrl: true } } }
})

for (const c of campaigns) {
  console.log(`\nCAMPAIGN: ${c.title}`)
  console.log(`  Location : ${c.location}`)
  console.log(`  Goal     : ₹${c.amount?.toLocaleString('en-IN')} | Raised: ₹${c.raisedAmount?.toLocaleString('en-IN')}`)
  console.log(`  Image    : ${c.imageUrl ? '✓ ' + c.imageUrl.split('/').pop() : '✗ MISSING'}`)
  for (const e of c.events) {
    console.log(`  EVENT    : ${e.title}`)
    console.log(`    @      : ${e.location}`)
    console.log(`    Date   : ${e.eventDate?.toDateString()}`)
    console.log(`    Image  : ${e.imageUrl ? '✓ ' + e.imageUrl.split('/').pop() : '✗ MISSING'}`)
  }
}

await prisma.$disconnect()
