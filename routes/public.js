import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// Public endpoint to get all data without restrictions
router.get('/all-data', async (req, res) => {
  try {
    const [campaigns, events, teamMembers] = await Promise.all([
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
      })
    ])

    res.json({
      success: true,
      data: {
        campaigns,
        events,
        teamMembers
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

export default router