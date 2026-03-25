import prisma from '../lib/prisma.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { body } from 'express-validator'
import { validateRequest } from '../middleware/errorHandler.js'
import bcrypt from 'bcrypt'
import { sendAdminPasswordResetOtp } from '../config/email.js'

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
    
    // Compare bcrypt hash stored in DB
    const isValidPassword = await bcrypt.compare(password, admin.password)
    
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

// ─── Admin forgot/reset password (OTP) ─────────────────────────────────────────

const forgotRules = [body('email').isEmail().withMessage('Valid email is required')]

/** POST /api/admin/forgot-password { email } → sends OTP */
export const adminForgotPassword = [
  ...forgotRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { email } = req.body

    // Always respond success to avoid account enumeration
    const genericOk = {
      success: true,
      message: 'If this email is an active admin, an OTP has been sent.'
    }

    const admin = await prisma.admin.findUnique({ where: { email } })
    if (!admin || !admin.isActive) return res.json(genericOk)

    const otp = String(Math.floor(100000 + Math.random() * 900000)) // 6 digits
    const otpHash = await bcrypt.hash(otp, 10)
    const ttlMin = Math.min(60, Math.max(5, parseInt(String(process.env.ADMIN_OTP_TTL_MINUTES || '10'), 10) || 10))
    const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000)

    await prisma.adminPasswordReset.create({
      data: {
        adminId: admin.id,
        otpHash,
        expiresAt
      }
    })

    // Non-blocking email send
    sendAdminPasswordResetOtp(email, otp).catch(console.error)

    return res.json(genericOk)
  })
]

const resetRules = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isString().trim().isLength({ min: 4, max: 12 }).withMessage('Valid OTP is required'),
  body('newPassword')
    .isString()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
]

/** POST /api/admin/reset-password { email, otp, newPassword } */
export const adminResetPassword = [
  ...resetRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body

    const admin = await prisma.admin.findUnique({ where: { email } })
    if (!admin || !admin.isActive) {
      return res.status(400).json({ success: false, message: 'Invalid OTP or email.' })
    }

    const resetReq = await prisma.adminPasswordReset.findFirst({
      where: {
        adminId: admin.id,
        consumedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!resetReq) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found.' })
    }

    const ok = await bcrypt.compare(String(otp).trim(), resetReq.otpHash)
    if (!ok) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)

    await prisma.$transaction([
      prisma.admin.update({
        where: { id: admin.id },
        data: { password: passwordHash }
      }),
      prisma.adminPasswordReset.update({
        where: { id: resetReq.id },
        data: { consumedAt: new Date() }
      })
    ])

    return res.json({ success: true, message: 'Password updated successfully.' })
  })
]
