/**
 * Seed script: Creates 4 Maharashtra campaigns + 4 linked events
 * Downloads free images and uploads them to Supabase storage
 * Run: node scripts/seed-examples.mjs
 */

import '../lib/loadEnv.js'
import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import { Buffer } from 'buffer'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)
const prisma = new PrismaClient()

// Free, stable image URLs from picsum.photos (seed = consistent image)
const IMAGE_SOURCES = {
  'campaign-healthcare':  'https://picsum.photos/seed/healthcare99/800/500',
  'campaign-water':       'https://picsum.photos/seed/water77/800/500',
  'campaign-education':   'https://picsum.photos/seed/education55/800/500',
  'campaign-farmers':     'https://picsum.photos/seed/farmers33/800/500',
  'event-medical-camp':   'https://picsum.photos/seed/medcamp88/800/500',
  'event-water-drive':    'https://picsum.photos/seed/waterdrv66/800/500',
  'event-scholarship':    'https://picsum.photos/seed/scholar44/800/500',
  'event-agri-workshop':  'https://picsum.photos/seed/agri22/800/500',
}

async function fetchImageBuffer(url) {
  console.log(`  Fetching: ${url}`)
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${url}`)
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function uploadToSupabase(bucket, filename, buffer) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, buffer, { contentType: 'image/jpeg', upsert: true })

  if (error) throw new Error(`Upload failed for ${filename}: ${error.message}`)

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filename)

  console.log(`  Uploaded → ${publicUrl}`)
  return publicUrl
}

// ─── Campaign definitions ────────────────────────────────────────────────────

const CAMPAIGNS = [
  {
    title: 'Rural Healthcare Outreach – Nashik',
    slug: 'rural-healthcare-outreach-nashik',
    description:
      'Bringing free medical care, essential medicines, and health awareness to underserved tribal communities across the Nashik district of Maharashtra.',
    location: 'Nashik, Maharashtra',
    amount: 1500000,
    raisedAmount: 875000,
    imageKey: 'campaign-healthcare',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    content: {
      about: [
        'The Rural Healthcare Outreach programme in Nashik district targets the Adivasi (tribal) communities of Trimbakeshwar, Igatpuri, and Peth talukas who have little or no access to primary healthcare.',
        'Our mobile medical units visit 42 villages every month, offering free consultations, blood tests, vaccinations, and medicines. Since inception, we have treated over 18,000 patients and conducted 6 multi-specialty mega camps.',
        'The programme also trains local women as Community Health Workers (CHWs) who monitor maternal and child health, refer critical cases, and distribute iron-folic acid and ORS kits to families year-round.',
      ],
      keyFocusAreas: [
        'Free multi-specialty medical camps in remote tribal areas',
        'Mobile health units visiting 42 villages every month',
        'Maternal and child health monitoring',
        'Tuberculosis detection and DOTS treatment support',
        'Eye care camps with free spectacles distribution',
        'Training of local Community Health Workers',
        'Nutrition rehabilitation for severely malnourished children',
        'Mental health awareness and counselling sessions',
      ],
      impactNumbers: [
        { value: '18,000+', label: 'Patients Treated' },
        { value: '42', label: 'Villages Covered' },
        { value: '6', label: 'Mega Health Camps' },
        { value: '120', label: 'CHWs Trained' },
      ],
      testimonials: [
        {
          quote:
            'Before this camp came to our village, we had to spend an entire day traveling to Nashik city just to see a doctor. Now the doctors come to us.',
          author: 'Tara Bhil',
          role: 'Tribal Farmer, Trimbakeshwar Block',
        },
        {
          quote:
            'The Community Health Workers trained by GAF caught my child\'s severe anaemia early. The intervention saved his life.',
          author: 'Savitri Warle',
          role: 'Mother, Igatpuri Village',
        },
      ],
    },
  },
  {
    title: 'Clean Water for Vidarbha',
    slug: 'clean-water-vidarbha',
    description:
      'Installing solar-powered water purification systems and reviving traditional step wells to provide safe drinking water to 30,000+ people in water-stressed Vidarbha.',
    location: 'Vidarbha, Maharashtra',
    amount: 2000000,
    raisedAmount: 1200000,
    imageKey: 'campaign-water',
    startDate: new Date('2024-03-01'),
    endDate: new Date('2025-02-28'),
    content: {
      about: [
        'Vidarbha is one of Maharashtra\'s most water-stressed regions, where thousands of villages depend on contaminated tanker water during the brutal summer months. Waterborne diseases claim dozens of lives every year.',
        'Guru Akanksha Foundation\'s Clean Water Initiative installs solar-powered Reverse Osmosis (RO) plants in village panchayat buildings, each unit serving 500–800 families with 20 litres of clean water per day.',
        'Beyond infrastructure, we conduct hygiene and sanitation workshops in schools and with women\'s self-help groups, linking water access to broader health outcomes across 18 villages of Amravati and Wardha districts.',
      ],
      keyFocusAreas: [
        'Solar-powered RO water purification plants',
        'Revival of traditional step wells and check dams',
        'Water quality testing every three months',
        'Hygiene and sanitation workshops in schools',
        'Women-led water management committees',
        'Rainwater harvesting systems for 500 households',
        'Groundwater recharge through nala-bunding',
        'Drought relief water distribution in summer',
      ],
      impactNumbers: [
        { value: '30,000+', label: 'Beneficiaries' },
        { value: '18', label: 'Villages Covered' },
        { value: '12', label: 'RO Plants Installed' },
        { value: '8', label: 'Wells Revived' },
      ],
      testimonials: [
        {
          quote:
            'We used to walk 3 km to fetch water that made our children sick. Today we have clean water at our doorstep — this has changed everything.',
          author: 'Radhabai Dhore',
          role: 'Village SHG Leader, Morshi Taluka',
        },
      ],
    },
  },
  {
    title: 'Girls Education Initiative – Pune',
    slug: 'girls-education-pune',
    description:
      'Empowering girls from marginalised communities in Pune district with scholarships, digital literacy, and career mentorship to break the cycle of poverty through education.',
    location: 'Pune, Maharashtra',
    amount: 1200000,
    raisedAmount: 930000,
    imageKey: 'campaign-education',
    startDate: new Date('2024-06-01'),
    endDate: new Date('2025-05-31'),
    content: {
      about: [
        'In Pune\'s peri-urban slums and rural blocks like Khed, Ambegaon, and Junnar, thousands of girls drop out after Class 7 due to financial hardship, early marriage pressure, and lack of safe transport.',
        'Our Girls Education Initiative provides merit-cum-need scholarships to 600 girls from Class 8 through graduation, covering tuition fees, books, uniforms, and a monthly stipend for transport and meals.',
        'Each scholar is assigned a mentor from our volunteer network — professionals who provide career guidance, skill workshops, and emotional support to help girls stay in school and dream bigger.',
      ],
      keyFocusAreas: [
        'Annual scholarships covering tuition, books and uniforms',
        'Digital literacy training and laptop access',
        'Career mentorship by professional volunteers',
        'Safe transport arrangement for rural students',
        'Bridge courses for girls rejoining school after dropout',
        'Parent counselling on importance of girls\' education',
        'Science and Maths coaching for competitive exams',
        'Residential study camps during board exam season',
      ],
      impactNumbers: [
        { value: '600', label: 'Girls Supported' },
        { value: '92%', label: 'Retention Rate' },
        { value: '48', label: 'College Graduates' },
        { value: '150+', label: 'Mentors Enrolled' },
      ],
      testimonials: [
        {
          quote:
            'This scholarship let me complete my B.Sc. Nursing degree. I am now working in Pune and supporting my younger sisters\' education.',
          author: 'Pooja Shinde',
          role: 'Scholarship Alumna, Ambegaon Block',
        },
        {
          quote:
            'Our daughter wanted to quit school at 14. The GAF mentor convinced her to stay. She just cleared her Class 12 with distinction.',
          author: 'Kiran Pawar',
          role: 'Parent, Junnar Village',
        },
      ],
    },
  },
  {
    title: 'Farmers\' Livelihood Support – Marathwada',
    slug: 'farmers-livelihood-marathwada',
    description:
      'Supporting distressed farmers of Marathwada through crop insurance guidance, organic farming training, and interest-free micro-loans to rebuild agricultural livelihoods after drought.',
    location: 'Marathwada, Maharashtra',
    amount: 2500000,
    raisedAmount: 1600000,
    imageKey: 'campaign-farmers',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2025-01-31'),
    content: {
      about: [
        'Marathwada — comprising Aurangabad, Latur, Beed, and Osmanabad districts — has faced consecutive drought years, leaving nearly 60% of farmers in debt with no viable income.',
        'Guru Akanksha Foundation\'s Farmers\' Livelihood Support programme provides interest-free micro-loans of ₹25,000–₹1 lakh with flexible repayment tied to harvest cycles, breaking the debt-trap cycle.',
        'Our agricultural extension workers train farmers in low-cost organic techniques, drip irrigation, and multi-cropping that reduce input costs by 40% while maintaining yields — transforming vulnerable monoculture farms into resilient smallholdings.',
      ],
      keyFocusAreas: [
        'Interest-free micro-loans linked to harvest repayment',
        'PM Fasal Bima Yojana enrollment and claim support',
        'Organic farming and drip irrigation training',
        'Farmer Producer Organisation (FPO) formation',
        'Soil health cards and soil testing camps',
        'Seed bank establishment at village level',
        'Livestock support and veterinary camps',
        'Women farmer self-help group strengthening',
      ],
      impactNumbers: [
        { value: '3,200+', label: 'Farmers Supported' },
        { value: '₹4.2 Cr', label: 'Loans Disbursed' },
        { value: '40%', label: 'Input Cost Reduction' },
        { value: '28', label: 'FPOs Formed' },
      ],
      testimonials: [
        {
          quote:
            'After two failed harvests I was ready to leave farming. The micro-loan and organic training from GAF gave me a second chance — my soybean yield doubled this year.',
          author: 'Dattatray Jadhav',
          role: 'Farmer, Beed District',
        },
      ],
    },
  },
]

// ─── Event definitions ────────────────────────────────────────────────────────

const EVENTS = [
  {
    title: 'Free Multi-Specialty Medical Camp – Igatpuri',
    slug: 'free-medical-camp-igatpuri',
    description:
      'A one-day mega medical camp providing free consultations from 12 specialist doctors, medicines, diagnostics, and eye care to tribal families of Igatpuri block, Nashik.',
    location: 'Igatpuri, Nashik, Maharashtra',
    eventDate: new Date('2024-11-15'),
    imageKey: 'event-medical-camp',
    campaignSlug: 'rural-healthcare-outreach-nashik',
    content: {
      about: [
        'Guru Akanksha Foundation, in partnership with Zen Multi-Specialty Hospital and the District Health Office, organises this annual mega medical camp at the Igatpuri Panchayat Samiti grounds.',
        'The camp brings together 12 specialist departments — general medicine, gynaecology, paediatrics, orthopaedics, ophthalmology, dentistry, and more — making expert healthcare accessible to communities that would otherwise travel 80 km to Nashik city.',
        'Patients receive free medicines, diagnostics, spectacles (where needed), and follow-up consultation slips. Critical cases are referred and transported to partner hospitals at no cost.',
      ],
      speakers: [
        { name: 'Dr. Meena Bhosale', role: 'Chief Medical Officer, Zen Hospital' },
        { name: 'Dr. Rajiv Kulkarni', role: 'Paediatrics Specialist' },
        { name: 'Dr. Sunita Pawar', role: 'Gynaecologist & Women\'s Health Expert' },
      ],
      agenda: [
        { time: '7:00 AM', title: 'Registration & Triage', description: 'Patient registration, vital signs check, and queue allocation by department.' },
        { time: '8:30 AM', title: 'Inaugural Ceremony', description: 'Welcome by GAF trustees, District Health Officer address, and lamp lighting.' },
        { time: '9:00 AM', title: 'Specialist Consultations Begin', description: 'All 12 specialist counters open; patients seen in order of registration.' },
        { time: '1:00 PM', title: 'Children\'s Nutrition Screening', description: 'Dedicated paediatric malnutrition screening and free nutritious meals for all patients.' },
        { time: '2:00 PM', title: 'Eye Care & Spectacles Distribution', description: 'Vision testing and free spectacles distribution for senior citizens and school children.' },
        { time: '5:00 PM', title: 'Medicines Distribution & Closing', description: 'Free medicine kits given to all registered patients; closing remarks.' },
      ],
      keyAchievements: [
        '1,200+ patients registered and treated in a single day',
        '12 specialist departments under one roof',
        '400 free spectacles distributed to seniors and children',
        '85 critical cases referred with free transport arranged',
        'Partnership with Zen Hospital and District Health Office',
        'Volunteer participation from 60+ medical students',
      ],
    },
  },
  {
    title: 'Water Conservation Drive & RO Plant Inauguration – Amravati',
    slug: 'water-conservation-drive-amravati',
    description:
      'Community mobilisation event celebrating the inauguration of 3 new solar RO water plants across Morshi and Warud talukas, with street plays and training for water management committees.',
    location: 'Amravati, Maharashtra',
    eventDate: new Date('2024-10-02'),
    imageKey: 'event-water-drive',
    campaignSlug: 'clean-water-vidarbha',
    content: {
      about: [
        'Held on Gandhi Jayanti to honour the Mahatma\'s principles of sustainability, this event marks the completion of Phase 2 of the Clean Water for Vidarbha campaign.',
        'Three new solar RO plants in Morshi, Warud, and Nandgaon Peth were inaugurated by the District Collector in the presence of 800 villagers, panchayat members, and women\'s self-help groups.',
        'The event featured a water conservation pledge rally, nukkad nataks (street plays) by local youth on water wastage, and training for newly formed women-led Water Management Committees.',
      ],
      speakers: [
        { name: 'Shri. Amol Deshpande', role: 'District Collector, Amravati' },
        { name: 'Padmaja Ingle', role: 'Campaign Lead, GAF Clean Water Initiative' },
        { name: 'Vimalbai Chavhan', role: 'President, Nandgaon Peth Women\'s SHG' },
      ],
      agenda: [
        { time: '9:00 AM', title: 'Inaugural Gathering', description: 'Community gathering at Amravati District Grounds; Gandhi Jayanti tribute and flag hoisting.' },
        { time: '10:00 AM', title: 'RO Plant Inaugurations', description: 'Live inauguration via video link of 3 new RO plants in Morshi, Warud, and Nandgaon Peth.' },
        { time: '11:30 AM', title: 'Street Plays on Water Conservation', description: 'Youth groups from 5 villages perform nukkad nataks on responsible water use and wastage.' },
        { time: '12:30 PM', title: 'Women Water Committee Training', description: 'Hands-on training for newly elected Water Management Committee members.' },
        { time: '2:00 PM', title: 'Water Conservation Pledge', description: 'Community-wide pledge on sustainable water use led by village sarpanches.' },
        { time: '3:00 PM', title: 'Village-Level Planning Session', description: 'Open forum for villages to plan local rainwater harvesting and conservation measures.' },
      ],
      keyAchievements: [
        'Inauguration of 3 solar-powered RO plants serving 4,500 families',
        '800+ community members participated across 18 villages',
        'Formation of 6 women-led Water Management Committees',
        'Coverage by Lokmat and Sakal regional newspapers',
        'District Collector committed matching fund for Phase 3',
        'Youth nukkad natak troupes from 5 villages performed',
      ],
    },
  },
  {
    title: 'Annual Scholarship & Awards Ceremony – Pune',
    slug: 'scholarship-awards-ceremony-pune',
    description:
      'A celebration where 150 girl students receive annual scholarships, hear from inspiring women leaders, and are honoured on stage for their academic achievements.',
    location: 'Balgandharva Rangmandir, Pune, Maharashtra',
    eventDate: new Date('2024-08-10'),
    imageKey: 'event-scholarship',
    campaignSlug: 'girls-education-pune',
    content: {
      about: [
        'The Annual Scholarship and Awards Ceremony is the centrepiece of the Girls Education Initiative — a moment of pride and visibility for the girls, their families, and the communities they come from.',
        'Held at the iconic Balgandharva Rangmandir in Pune, the event brings together 150 scholarship recipients, their parents, donor partners, and distinguished women leaders across fields from medicine to entrepreneurship.',
        'Each girl is called to the stage to receive her scholarship certificate and a ₹5,000 book voucher. The programme includes motivational talks, panel discussions on careers, and live performances by the scholars themselves.',
      ],
      speakers: [
        { name: 'Dr. Archana Chitnis', role: 'Former Minister, Women & Child Development, Maharashtra' },
        { name: 'Ritu Jain', role: 'IPS Officer & Women Empowerment Champion' },
        { name: 'Priya Gokhale', role: 'Entrepreneur, Forbes Under-30 Honouree' },
      ],
      agenda: [
        { time: '4:00 PM', title: 'Welcome & Cultural Programme', description: 'Classical dance and song performances by scholarship students from the current batch.' },
        { time: '4:45 PM', title: 'Keynote: "Dream Without Limits"', description: 'Inspirational address by Dr. Archana Chitnis on women\'s leadership in Maharashtra.' },
        { time: '5:30 PM', title: 'Scholarship Presentation', description: 'Individual scholarship certificates and ₹5,000 book vouchers presented to all 150 students.' },
        { time: '6:30 PM', title: 'Mentor-Scholar Connect Session', description: 'Informal networking pairing students with professional mentors for the year ahead.' },
        { time: '7:00 PM', title: 'Panel: Women in STEM & Beyond', description: 'Interactive panel with IPS officer, entrepreneur, and doctor on career pathways.' },
        { time: '7:45 PM', title: 'Valedictory & Pledge', description: 'Collective pledge by scholars to give back to their communities; vote of thanks.' },
      ],
      keyAchievements: [
        '150 scholarships awarded totalling ₹75 lakh',
        '3 inspiring women leaders addressed 600+ attendees',
        '48 girls from previous batches now in college or employed',
        'Covered by Pune Mirror, Sakal, and Maharashtra Times',
        '35 new donors pledged support for the next academic year',
        'Cultural performances by students received standing ovation',
      ],
    },
  },
  {
    title: 'Organic Farming & Crop Insurance Workshop – Beed',
    slug: 'agricultural-training-workshop-beed',
    description:
      'A hands-on two-day workshop for 300 Marathwada farmers on organic farming techniques, drip irrigation, and PM Fasal Bima Yojana enrollment facilitated by Krishi Vigyan Kendra experts.',
    location: 'Krishi Vigyan Kendra, Beed, Maharashtra',
    eventDate: new Date('2024-12-05'),
    imageKey: 'event-agri-workshop',
    campaignSlug: 'farmers-livelihood-marathwada',
    content: {
      about: [
        'Conducted at the Beed Krishi Vigyan Kendra in collaboration with the Maharashtra Agriculture Department, this two-day residential workshop equips small and marginal farmers with practical tools to reduce costs and improve yield quality.',
        'The programme covers organic nutrient management using farm waste, low-cost drip irrigation installation, forming Farmer Producer Organisations (FPOs), and step-by-step guidance on enrolling in PM Fasal Bima Yojana.',
        'Past participants have reported a 40% reduction in input costs after switching to organic techniques and a 28% increase in net income within the first harvest cycle post-training.',
      ],
      speakers: [
        { name: 'Dr. Suresh Patil', role: 'Agricultural Scientist, Krishi Vigyan Kendra Beed' },
        { name: 'Smt. Anusaya Kamble', role: 'Lead Farmer & FPO President, Ambajogai' },
        { name: 'Rajan Munde', role: 'District Agriculture Officer, Beed' },
      ],
      agenda: [
        { time: 'Day 1 – 9:00 AM', title: 'Inauguration & Farmer Registration', description: 'Welcome of 300 participating farmers; district agriculture officer\'s opening address.' },
        { time: 'Day 1 – 10:00 AM', title: 'Organic Farming Techniques', description: 'Hands-on demonstration of bio-fertiliser preparation, vermicomposting, and soil health improvement.' },
        { time: 'Day 1 – 2:00 PM', title: 'Drip Irrigation Field Demo', description: 'Live field demonstration of low-cost drip irrigation on cotton and soybean plots.' },
        { time: 'Day 2 – 9:00 AM', title: 'PM Fasal Bima Workshop', description: 'Step-by-step crop insurance application guidance; on-site enrollment with government officials.' },
        { time: 'Day 2 – 11:00 AM', title: 'FPO Formation & Market Linkage', description: 'Session on forming Farmer Producer Organisations and connecting to APMC and e-NAM platforms.' },
        { time: 'Day 2 – 3:00 PM', title: 'Micro-Loan Disbursement & Closing', description: 'Interest-free micro-loan applications received; certificate distribution and closing ceremony.' },
      ],
      keyAchievements: [
        '300 farmers trained across 2 intensive residential days',
        '180 farmers successfully enrolled in PM Fasal Bima Yojana',
        '12 new Farmer Producer Organisations registered',
        '₹1.2 crore in micro-loans disbursed at closing ceremony',
        'Krishi Vigyan Kendra certified all 300 participants',
        '85% of participants committed to full organic conversion next season',
      ],
    },
  },
]

// ─── Main seed logic ──────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱  GAF Maharashtra Seed Script\n')

  // 1. Upload all images to Supabase
  console.log('── Step 1: Uploading images to Supabase ──')
  const imageUrls = {}

  for (const [key, url] of Object.entries(IMAGE_SOURCES)) {
    const bucket = key.startsWith('campaign-') ? 'campaigns-images' : 'events-images'
    const filename = `seed-${key}-${Date.now()}.jpg`
    try {
      const buffer = await fetchImageBuffer(url)
      imageUrls[key] = await uploadToSupabase(bucket, filename, buffer)
    } catch (err) {
      console.error(`  ✗ Failed to upload ${key}: ${err.message}`)
      // Use a placeholder so the rest can continue
      imageUrls[key] = null
    }
  }

  // 2. Create campaigns
  console.log('\n── Step 2: Creating campaigns ──')
  const campaignIdMap = {}

  for (const c of CAMPAIGNS) {
    // Skip if slug already exists
    const existing = await prisma.campaign.findUnique({ where: { slug: c.slug } })
    if (existing) {
      console.log(`  ⚠  Campaign already exists: ${c.slug} (skipping)`)
      campaignIdMap[c.slug] = existing.id
      continue
    }

    const created = await prisma.campaign.create({
      data: {
        title: c.title,
        slug: c.slug,
        description: c.description,
        location: c.location,
        amount: c.amount,
        raisedAmount: c.raisedAmount,
        imageUrl: imageUrls[c.imageKey] || null,
        content: c.content,
        startDate: c.startDate,
        endDate: c.endDate,
        isActive: true,
      },
    })
    campaignIdMap[c.slug] = created.id
    console.log(`  ✓  Campaign created: "${c.title}" (${created.id})`)
  }

  // 3. Create events linked to campaigns
  console.log('\n── Step 3: Creating events ──')

  for (const e of EVENTS) {
    const existing = await prisma.event.findUnique({ where: { slug: e.slug } })
    if (existing) {
      console.log(`  ⚠  Event already exists: ${e.slug} (skipping)`)
      continue
    }

    const campaignId = campaignIdMap[e.campaignSlug] || null

    const created = await prisma.event.create({
      data: {
        title: e.title,
        slug: e.slug,
        description: e.description,
        location: e.location,
        eventDate: e.eventDate,
        imageUrl: imageUrls[e.imageKey] || null,
        content: e.content,
        campaignId,
        isActive: true,
      },
    })
    console.log(`  ✓  Event created: "${e.title}" → linked to campaign: ${e.campaignSlug} (${created.id})`)
  }

  console.log('\n✅  Seeding complete!\n')
}

main()
  .catch((err) => {
    console.error('\n❌  Seed failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
