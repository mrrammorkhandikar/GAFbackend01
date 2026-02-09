import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../middleware/errorHandler.js'
import { body } from 'express-validator'
import { validateRequest } from '../middleware/errorHandler.js'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

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
