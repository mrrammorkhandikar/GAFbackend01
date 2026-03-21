import prisma from '../lib/prisma.js'
import { parsePageLimit } from '../lib/pagination.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { body, param } from 'express-validator'
import { validateRequest } from '../middleware/errorHandler.js'
import { sendVolunteerConfirmation, sendVolunteerAdminAlert } from '../config/email.js'

const volunteerSubmissionValidationRules = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('opportunityId').isUUID().withMessage('Valid opportunity ID is required')
]

export const getVolunteerSubmissions = asyncHandler(async (req, res) => {
  const { opportunityId } = req.query
  const { page, limit, skip } = parsePageLimit(req.query, { defaultLimit: 10, maxLimit: 100 })
  
  const where = {}
  if (opportunityId) {
    where.opportunityId = opportunityId
  }
  
  const [submissions, total] = await Promise.all([
    prisma.volunteer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        opportunity: {
          select: {
            id: true,
            title: true
          }
        }
      }
    }),
    prisma.volunteer.count({ where })
  ])
  
  res.json({
    success: true,
    data: submissions,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit
    }
  })
})

export const createVolunteerSubmission = [
  ...volunteerSubmissionValidationRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { name, email, phone, opportunityId } = req.body
    
    // Check if opportunity exists
    const opportunity = await prisma.volunteerOpportunity.findUnique({
      where: { id: opportunityId }
    })
    
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer opportunity not found'
      })
    }
    
    // Check if user already applied
    const existingSubmission = await prisma.volunteer.findFirst({
      where: {
        email,
        opportunityId
      }
    })
    
    if (existingSubmission) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied for this opportunity'
      })
    }
    
    const submission = await prisma.volunteer.create({
      data: {
        name,
        email,
        phone,
        opportunityId
      }
    })

    // Send emails (non-blocking)
    sendVolunteerConfirmation(email, name, opportunity.title).catch(console.error)
    sendVolunteerAdminAlert(name, email, phone, opportunity.title).catch(console.error)
    
    res.status(201).json({
      success: true,
      message: 'Volunteer application submitted successfully',
      data: submission
    })
  })
]

export const getVolunteerSubmissionById = asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const submission = await prisma.volunteer.findUnique({
    where: { id },
    include: {
      opportunity: {
        select: {
          id: true,
          title: true,
          description: true
        }
      }
    }
  })
  
  if (!submission) {
    return res.status(404).json({
      success: false,
      message: 'Volunteer submission not found'
    })
  }
  
  res.json({
    success: true,
    data: submission
  })
})

// GET /api/volunteer-submissions/public - Get public volunteer submissions (simplified method for frontend)
export const getPublicVolunteerSubmissions = asyncHandler(async (req, res) => {
  try {
    const submissions = await prisma.volunteer.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Error fetching public volunteer submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching volunteer submissions',
      error: error.message
    });
  }
})
