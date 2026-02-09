import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seed() {
  try {
    console.log('🌱 Starting database seeding...')
    
    // Create admin user if it doesn't exist
    let admin = await prisma.admin.findUnique({
      where: { email: 'admin@gaf.org' }
    })
    
    if (!admin) {
      admin = await prisma.admin.create({
        data: {
          email: 'admin@gaf.org',
          password: '$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // bcrypt hash for 'password123'
          isActive: true
        }
      })
      console.log(`✅ Created admin user: ${admin.email}`)
    } else {
      console.log(`⚠️ Admin user already exists: ${admin.email}`)
    }
    
    // Create sample campaigns
    const campaigns = await prisma.campaign.createMany({
      data: [
        {
          title: 'Global Health Initiative',
          slug: 'global-health-initiative',
          description: 'Improving healthcare access worldwide through education and community programs.',
          location: 'Global',
          amount: 50000,
          raisedAmount: 35000,
          content: JSON.stringify({
            about: [
              'Our Global Health Initiative focuses on providing medical care, health education, and preventive services to underserved communities around the world.',
              'We work with local partners to establish sustainable healthcare programs that continue long after our teams depart.'
            ],
            impactGallery: [
              'https://example.com/health1.jpg',
              'https://example.com/health2.jpg'
            ],
            keyFocusAreas: [
              'Maternal and child health services',
              'Disease prevention and vaccination programs',
              'Health worker training and capacity building',
              'Community health education initiatives'
            ]
          }),
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          isActive: true
        },
        {
          title: 'Education for All',
          slug: 'education-for-all',
          description: 'Providing educational opportunities to children in developing countries.',
          location: 'Africa, Asia',
          amount: 75000,
          raisedAmount: 45000,
          content: JSON.stringify({
            about: [
              'We believe education is the foundation for sustainable development. Our Education for All campaign builds schools, trains teachers, and provides learning materials to communities in need.',
              'Our approach focuses on quality education that prepares children for the challenges of the modern world.'
            ],
            impactGallery: [
              'https://example.com/edu1.jpg',
              'https://example.com/edu2.jpg',
              'https://example.com/edu3.jpg'
            ],
            keyFocusAreas: [
              'School infrastructure development',
              'Teacher training programs',
              'Educational material distribution',
              'Digital literacy initiatives',
              'Girls education support'
            ]
          }),
          startDate: new Date('2024-03-01'),
          isActive: true
        }
      ],
      skipDuplicates: true
    })
    
    console.log(`✅ Created ${campaigns.count} campaigns`)
    
    // Create sample events
    const globalHealthCampaign = await prisma.campaign.findUnique({
      where: { slug: 'global-health-initiative' }
    })
    
    if (globalHealthCampaign) {
      const events = await prisma.event.createMany({
        data: [
          {
            title: 'Medical Camp in Rural Kenya',
            slug: 'medical-camp-kenya',
            description: 'Free medical screening and treatment for rural communities.',
            eventDate: new Date('2024-07-15'),
            location: 'Kakamega County, Kenya',
            content: JSON.stringify({
              about: [
                'Join us for a week-long medical camp providing free healthcare services to remote villages in western Kenya.',
                'Our team of doctors and nurses will offer general consultations, maternal health services, and pediatric care.'
              ],
              journey: [
                {
                  title: 'Day 1-2: Setup and Community Outreach',
                  description: 'Arrival and establishment of medical facilities, community awareness sessions'
                },
                {
                  title: 'Day 3-5: Medical Services',
                  description: 'Full medical camp operations with various specialist consultations'
                },
                {
                  title: 'Day 6-7: Follow-up and Training',
                  description: 'Patient follow-ups and training local health workers'
                }
              ],
              keyAchievements: [
                'Over 500 patients treated in previous camps',
                'Establishment of permanent health posts',
                'Training of 20+ local health workers',
                'Distribution of essential medicines worth $10,000'
              ]
            }),
            campaignId: globalHealthCampaign.id,
            isActive: true
          }
        ],
        skipDuplicates: true
      })
      
      console.log(`✅ Created ${events.count} events`)
    }
    
    // Create volunteer opportunities
    const volunteerOps = await prisma.volunteerOpportunity.createMany({
      data: [
        {
          title: 'Medical Volunteer - International Health Program',
          description: 'Join our team of healthcare professionals providing medical services in underserved communities worldwide.',
          requirements: JSON.stringify([
            'Medical degree or nursing qualification',
            'Minimum 2 years clinical experience',
            'Fluency in English',
            'Ability to work in challenging environments',
            'Current medical license in good standing'
          ]),
          benefits: JSON.stringify([
            'Meaningful contribution to global health',
            'Professional development opportunities',
            'Travel and accommodation covered',
            'Certificate of participation',
            'Networking with international health professionals'
          ]),
          isActive: true
        },
        {
          title: 'Education Volunteer - Teaching Program',
          description: 'Help us improve educational outcomes by teaching and mentoring children in developing countries.',
          requirements: JSON.stringify([
            'Bachelor\'s degree in any field',
            'Teaching experience preferred',
            'Patience and cultural sensitivity',
            'Commitment to 6-month minimum program',
            'Basic computer literacy'
          ]),
          benefits: JSON.stringify([
            'Make a lasting impact on children\'s lives',
            'Experience different cultures',
            'Professional development',
            'Living stipend provided',
            'Supportive team environment'
          ]),
          isActive: true
        }
      ],
      skipDuplicates: true
    })
    
    console.log(`✅ Created ${volunteerOps.count} volunteer opportunities`)
    
    // Create career opportunities
    const careers = await prisma.career.createMany({
      data: [
        {
          title: 'Program Manager - Global Health',
          description: 'Lead our health programs across multiple countries, managing teams and ensuring program effectiveness.',
          location: 'Remote/Hybrid',
          employmentType: 'Full-time',
          isActive: true
        },
        {
          title: 'Fundraising Coordinator',
          description: 'Develop and implement fundraising strategies to support our global initiatives.',
          location: 'New York, NY',
          employmentType: 'Full-time',
          isActive: true
        },
        {
          title: 'Digital Marketing Intern',
          description: 'Support our marketing efforts through digital campaigns and social media management.',
          location: 'San Francisco, CA',
          employmentType: 'Internship',
          isActive: true
        }
      ],
      skipDuplicates: true
    })
    
    console.log(`✅ Created ${careers.count} career opportunities`)
    
    // Create sample team members
    const teamMembers = await prisma.teamMember.createMany({
      data: [
        {
          name: 'Dr. Sarah Johnson',
          position: 'Executive Director',
          bio: 'With over 15 years of experience in international development, Dr. Johnson leads our organization with passion and expertise.',
          email: 'sarah.johnson@gaf.org',
          linkedinUrl: 'https://linkedin.com/in/sarahjohnson',
          isActive: true
        },
        {
          name: 'Michael Chen',
          position: 'Program Manager',
          bio: 'Michael oversees our field operations and ensures our programs deliver maximum impact to communities in need.',
          email: 'michael.chen@gaf.org',
          linkedinUrl: 'https://linkedin.com/in/michaelchen',
          isActive: true
        },
        {
          name: 'Dr. Amara Okafor',
          position: 'Medical Director',
          bio: 'Dr. Okafor leads our healthcare initiatives with extensive experience in tropical medicine and community health.',
          email: 'amara.okafor@gaf.org',
          linkedinUrl: 'https://linkedin.com/in/amaraokafor',
          isActive: true
        }
      ],
      skipDuplicates: true
    })
    
    console.log(`✅ Created ${teamMembers.count} team members`)
    
    console.log('🎉 Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seed()