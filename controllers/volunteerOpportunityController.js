import prisma from '../lib/prisma.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { body, param } from 'express-validator'
import { validateRequest } from '../middleware/errorHandler.js'

// Validation rules for volunteer opportunity
const volunteerOpportunityValidationRules = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('requirements').notEmpty().withMessage('Requirements are required'),
  body('benefits').notEmpty().withMessage('Benefits are required')
]

// GET /api/volunteer-opportunities - Get all volunteer opportunities
export const getVolunteerOpportunities = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, active } = req.query
  
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const skip = (pageNum - 1) * limitNum
  
  const where = {}
  if (active !== undefined) {
    where.isActive = active === 'true'
  }
  
  const [opportunities, total] = await Promise.all([
    prisma.volunteerOpportunity.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        volunteers: {
          select: {
            id: true
          }
        }
      }
    }),
    prisma.volunteerOpportunity.count({ where })
  ])
  
  res.json({
    success: true,
    data: opportunities,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum
    }
  })
})

// GET /api/volunteer-opportunities/:id - Get opportunity by ID
export const getVolunteerOpportunityById = asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const opportunity = await prisma.volunteerOpportunity.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          volunteers: true
        }
      },
      volunteers: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true
        }
      }
    }
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

// POST /api/volunteer-opportunities - Create new volunteer opportunity
export const createVolunteerOpportunity = [
  ...volunteerOpportunityValidationRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { title, description, requirements, benefits, isActive = true } = req.body
    
    // Parse JSON arrays if they're strings
    let parsedRequirements = requirements
    let parsedBenefits = benefits
    
    if (typeof requirements === 'string') {
      try {
        parsedRequirements = JSON.parse(requirements)
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid requirements format'
        })
      }
    }
    
    if (typeof benefits === 'string') {
      try {
        parsedBenefits = JSON.parse(benefits)
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid benefits format'
        })
      }
    }
    
    const opportunity = await prisma.volunteerOpportunity.create({
      data: {
        title,
        description,
        requirements: parsedRequirements,
        benefits: parsedBenefits,
        isActive
      }
    })
    
    res.status(201).json({
      success: true,
      message: 'Volunteer opportunity created successfully',
      data: opportunity
    })
  })
]

// PUT /api/volunteer-opportunities/:id - Update volunteer opportunity
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
    
    // Parse JSON arrays if they're strings
    let parsedRequirements = requirements
    let parsedBenefits = benefits
    
    if (typeof requirements === 'string') {
      try {
        parsedRequirements = JSON.parse(requirements)
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid requirements format'
        })
      }
    }
    
    if (typeof benefits === 'string') {
      try {
        parsedBenefits = JSON.parse(benefits)
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid benefits format'
        })
      }
    }
    
    const opportunity = await prisma.volunteerOpportunity.update({
      where: { id },
      data: {
        title,
        description,
        requirements: parsedRequirements,
        benefits: parsedBenefits,
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

// DELETE /api/volunteer-opportunities/:id - Delete volunteer opportunity
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
