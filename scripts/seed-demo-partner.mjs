/**
 * Inserts (or refreshes) one demo Partner row. Safe to run multiple times (upsert by slug).
 * Run from backend: node scripts/seed-demo-partner.mjs
 */

import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import { randomUUID } from 'crypto'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })

const prisma = new PrismaClient()

const SLUG = 'demo-sahyadri-health-collaborative'

const demo = {
  name: 'Sahyadri Health Collaborative',
  slug: SLUG,
  type: 'NGO',
  shortDescription:
    'Maharashtra-based NGO running mobile clinics, maternal health, and school health programmes in partnership with GAF.',
  websiteUrl: 'https://example.org/sahyadri-health-demo',
  country: 'India',
  city: 'Pune',
  logoUrl: 'https://picsum.photos/seed/gafpartnerdemo/240/240',
  isFeatured: true,
  isActive: true,
  content: {
    about: [
      'Sahyadri Health Collaborative works with district hospitals and ASHA networks to bring screening and follow-up care to villages that are hard to reach by road.',
      'Since 2019 the organisation has supported over 120 outreach days, focusing on anaemia, hypertension, and diabetes detection for adults, and growth monitoring for children under five.',
      'This demo profile illustrates how partner storytelling appears on the public site: multiple paragraphs, structured programmes, and highlights.',
    ],
    programs: [
      'Mobile clinic days — vitals, basic labs, and referrals',
      'Maternal health — antenatal counselling and iron supplementation drives',
      'School health — vision screening and hygiene workshops in ZP schools',
      'Training — refresher sessions for community health volunteers',
    ],
    highlights: [
      '12 districts covered across Western Maharashtra (demo figures)',
      'Partnership model: local PHCs + NGO field teams + volunteer doctors',
      'Bilingual materials (Marathi / English) for patient education',
    ],
    quote: {
      text: 'Lasting impact comes from staying with communities after the camp ends—not only on the day of the event.',
      author: 'Dr. Ananya Kulkarni',
      role: 'Programme Director (demo)',
    },
  },
}

async function main() {
  const now = new Date()
  const row = await prisma.partner.upsert({
    where: { slug: SLUG },
    create: {
      id: randomUUID(),
      ...demo,
      updatedAt: now,
    },
    update: {
      ...demo,
      updatedAt: now,
    },
  })
  console.log('Partner upserted:', row.id, row.slug, row.name)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
