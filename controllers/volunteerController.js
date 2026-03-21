import prisma from '../lib/prisma.js'
import { parsePageLimit } from '../lib/pagination.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { body, param } from 'express-validator'
import { validateRequest } from '../middleware/errorHandler.js'

const volunteerOpportunityValidationRules = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required')
]

export const getVolunteerOpportunities = asyncHandler(async (req, res) => {
  const { active = true } = req.query
  const { page, limit, skip } = parsePageLimit(req.query, { defaultLimit: 10, maxLimit: 100 })
  
  const where = {}
  if (active !== undefined) {
    where.isActive = active === 'true'
  }
  
  const [opportunities, total] = await Promise.all([
    prisma.volunteerOpportunity.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.volunteerOpportunity.count({ where })
  ])
  
  res.json({
    success: true,
    data: opportunities,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit
    }
  })
})

export const getVolunteerOpportunityById = asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const opportunity = await prisma.volunteerOpportunity.findUnique({
    where: { id }
  })
  
  if (!opportunity) {
    return res.status(404).json({
      success: false,
      message: 'Volunteer opportunity not found'
    })
  }
  
  res.json({
    success: true,
    data: opportunity
  })
})

export const createVolunteerOpportunity = [
  ...volunteerOpportunityValidationRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { title, description, requirements, benefits } = req.body
    
    const opportunity = await prisma.volunteerOpportunity.create({
      data: {
        title,
        description,
        requirements: typeof requirements === 'string' ? JSON.parse(requirements) : requirements,
        benefits: typeof benefits === 'string' ? JSON.parse(benefits) : benefits
      }
    })
    
    res.status(201).json({
      success: true,
      message: 'Volunteer opportunity created successfully',
      data: opportunity
    })
  })
]

export const updateVolunteerOpportunity = [
  param('id').isUUID().withMessage('Valid opportunity ID is required'),
  ...volunteerOpportunityValidationRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { title, description, requirements, benefits, isActive } = req.body
    
    const existingOpportunity = await prisma.volunteerOpportunity.findUnique({
      where: { id }
    })
    
    if (!existingOpportunity) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer opportunity not found'
      })
    }
    
    const opportunity = await prisma.volunteerOpportunity.update({
      where: { id },
      data: {
        title,
        description,
        requirements: requirements ? (typeof requirements === 'string' ? JSON.parse(requirements) : requirements) : existingOpportunity.requirements,
        benefits: benefits ? (typeof benefits === 'string' ? JSON.parse(benefits) : benefits) : existingOpportunity.benefits,
        isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : existingOpportunity.isActive
      }
    })
    
    res.json({
      success: true,
      message: 'Volunteer opportunity updated successfully',
      data: opportunity
    })
  })
]

export const deleteVolunteerOpportunity = asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const opportunity = await prisma.volunteerOpportunity.findUnique({
    where: { id }
  })
  
  if (!opportunity) {
    return res.status(404).json({
      success: false,
      message: 'Volunteer opportunity not found'
    })
  }
  
  await prisma.volunteerOpportunity.delete({
    where: { id }
  })
  
  res.json({
    success: true,
    message: 'Volunteer opportunity deleted successfully'
  })
})

// GET /api/volunteer-opportunities/public - Get public volunteer opportunities (simplified method for frontend)
export const getPublicVolunteerOpportunities = asyncHandler(async (req, res) => {
  try {
    const opportunities = await prisma.volunteerOpportunity.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: opportunities
    });
  } catch (error) {
    console.error('Error fetching public volunteer opportunities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching volunteer opportunities',
      error: error.message
    });
  }
})
