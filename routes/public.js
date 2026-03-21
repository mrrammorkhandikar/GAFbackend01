import express from 'express'
import prisma from '../lib/prisma.js'

const router = express.Router()

/** UPI / bank details for donate page (configure via env on server) */
router.get('/donation-payment-info', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
  let upiQrUrl = process.env.DONATION_UPI_QR_URL || ''
  if (upiQrUrl && !upiQrUrl.startsWith('http')) {
    upiQrUrl = `${frontendUrl.replace(/\/$/, '')}${upiQrUrl.startsWith('/') ? '' : '/'}${upiQrUrl}`
  }

  res.json({
    success: true,
    data: {
      upiId: process.env.DONATION_UPI_ID || '',
      upiQrUrl: upiQrUrl || `${frontendUrl.replace(/\/$/, '')}/images/donate-upi-qr.svg`,
      bankName: process.env.DONATION_BANK_NAME || '',
      bankAccount: process.env.DONATION_BANK_ACCOUNT || '',
      bankIfsc: process.env.DONATION_BANK_IFSC || ''
    }
  })
})

// Public endpoint to get all data without restrictions
router.get('/all-data', async (req, res) => {
  try {
    const [campaigns, events, teamMembers, partners] = await Promise.all([
      prisma.campaign.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.event.findMany({
        where: { isActive: true },
        orderBy: { eventDate: 'asc' }
      }),
      prisma.teamMember.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.partner.findMany({
        where: { isActive: true },
        orderBy: [
          { isFeatured: 'desc' },
          { createdAt: 'desc' }
        ]
      })
    ])

    res.json({
      success: true,
      data: {
        campaigns,
        events,
        teamMembers,
        partners
      }
    })
  } catch (error) {
    console.error('Error fetching all data:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching data',
      error: error.message
    })
  }
})

// Public endpoint to get campaigns only
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      success: true,
      data: campaigns
    })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching campaigns',
      error: error.message
    })
  }
})

// Public endpoint to get events only
router.get('/events', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { isActive: true },
      orderBy: { eventDate: 'asc' }
    })

    res.json({
      success: true,
      data: events
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
      error: error.message
    })
  }
})

// Public endpoint to get team members only
router.get('/team', async (req, res) => {
  try {
    const teamMembers = await prisma.teamMember.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      success: true,
      data: teamMembers
    })
  } catch (error) {
    console.error('Error fetching team members:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching team members',
      error: error.message
    })
  }
})

// Public endpoint to get hero slider images (active only, for homepage)
router.get('/hero-slides', async (req, res) => {
  try {
    const slides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    })

    res.json({
      success: true,
      data: slides
    })
  } catch (error) {
    console.error('Error fetching hero slides:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching hero slides',
      error: error.message
    })
  }
})

export default router