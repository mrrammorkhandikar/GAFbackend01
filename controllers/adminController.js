import prisma from '../lib/prisma.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { body } from 'express-validator'
import { validateRequest } from '../middleware/errorHandler.js'
import bcrypt from 'bcrypt'

const adminLoginValidationRules = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
]

export const adminLogin = [
  ...adminLoginValidationRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body
    
    // Find admin user
    const admin = await prisma.admin.findUnique({
      where: { email }
    })
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }
    
    // Check password (in real app, use bcrypt.compare)
    // For demo purposes, we'll use a simple comparison
    // In production, store hashed passwords and use:
    // const isValidPassword = await bcrypt.compare(password, admin.password)
    const isValidPassword = password === 'password123' // Demo password
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }
    
    // In production, you would generate a JWT token here
    // const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET)
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        id: admin.id,
        email: admin.email,
        // token: token // Include in production
      }
    })
  })
]

export const getAdminProfile = asyncHandler(async (req, res) => {
  // This would typically verify a JWT token
  // For now, we'll simulate getting admin profile
  const adminId = req.headers['admin-id'] // Simulated header
  
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      email: true,
      isActive: true,
      createdAt: true
    }
  })
  
  if (!admin) {
    return res.status(404).json({
      success: false,
      message: 'Admin not found'
    })
  }
  
  res.json({
    success: true,
    data: admin
  })
})

export const getAllAdminStats = asyncHandler(async (req, res) => {
  // Get counts for dashboard
  const [
    campaignsCount,
    eventsCount,
    volunteerOpsCount,
    careersCount,
    donationsCount,
    contactsCount
  ] = await Promise.all([
    prisma.campaign.count(),
    prisma.event.count(),
    prisma.volunteerOpportunity.count(),
    prisma.career.count(),
    prisma.donation.count(),
    prisma.contactForm.count()
  ])
  
  res.json({
    success: true,
    data: {
      campaigns: campaignsCount,
      events: eventsCount,
      volunteerOpportunities: volunteerOpsCount,
      careers: careersCount,
      donations: donationsCount,
      contactForms: contactsCount
    }
  })
})

/** Donations + event registrations since `hours` ago (default 48), merged by time */
export const getAdminRecentActivity = asyncHandler(async (req, res) => {
  const hours = Math.min(168, Math.max(1, parseInt(String(req.query.hours || '48'), 10) || 48))
  const since = new Date(Date.now() - hours * 60 * 60 * 1000)

  const [donations, registrations] = await Promise.all([
    prisma.donation.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 60,
      include: {
        campaign: { select: { id: true, title: true, slug: true } }
      }
    }),
    prisma.eventRegistration.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 60,
      include: {
        event: { select: { id: true, title: true, slug: true } }
      }
    })
  ])

  const donationItems = donations.map((d) => ({
    id: d.id,
    kind: 'donation',
    createdAt: d.createdAt,
    headline: d.isAnonymous ? 'New donation (anonymous)' : `New donation from ${d.donorName}`,
    detail: `${d.currency || 'INR'} ${Number(d.amount).toLocaleString('en-IN')} · ${d.status}${d.campaign?.title ? ` · ${d.campaign.title}` : ''}`,
    status: d.status,
    href: '/admin/donations'
  }))

  const registrationItems = registrations.map((r) => ({
    id: r.id,
    kind: 'event_registration',
    createdAt: r.createdAt,
    headline: `Event registration: ${r.name}`,
    detail: `${r.event?.title || 'Event'} · ${r.status} · ${r.email}`,
    status: r.status,
    href: '/admin/events/registrations'
  }))

  const items = [...donationItems, ...registrationItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  res.json({
    success: true,
    data: {
      items,
      count: items.length,
      hours
    }
  })
})
