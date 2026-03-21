import '../lib/loadEnv.js'
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

const campaigns = await p.campaign.findMany({ select: { title: true, imageUrl: true }, where: { imageUrl: { not: null } } })
const events = await p.event.findMany({ select: { title: true, imageUrl: true }, where: { imageUrl: { not: null } } })

console.log('\n── Campaign Images ──')
for (const item of campaigns) {
  const res = await fetch(item.imageUrl)
  const fname = item.imageUrl.split('/').pop().substring(0, 40)
  console.log(`${res.status === 200 ? '✓' : '✗'} [${res.status}] ${fname}`)
  console.log(`  └ ${item.title}`)
}

console.log('\n── Event Images ──')
for (const item of events) {
  const res = await fetch(item.imageUrl)
  const fname = item.imageUrl.split('/').pop().substring(0, 40)
  console.log(`${res.status === 200 ? '✓' : '✗'} [${res.status}] ${fname}`)
  console.log(`  └ ${item.title}`)
}

await p.$disconnect()
