import prisma from '../lib/prisma.js'
import { parsePageLimit } from '../lib/pagination.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { body, param } from 'express-validator'
import { validateRequest } from '../middleware/errorHandler.js'

// Validation rules for career
const careerValidationRules = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('employmentType').isIn(['Full-time', 'Part-time', 'Internship']).withMessage('Valid employment type is required')
]

// GET /api/careers - Get all careers
export const getCareers = asyncHandler(async (req, res) => {
  const { active } = req.query
  const { page, limit, skip } = parsePageLimit(req.query, { defaultLimit: 10, maxLimit: 100 })
  
  const where = {}
  if (active !== undefined) {
    where.isActive = active === 'true'
  }
  
  const [careers, total] = await Promise.all([
    prisma.career.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      }
    }),
    prisma.career.count({ where })
  ])
  
  res.json({
    success: true,
    data: careers,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit
    }
  })
})

// GET /api/careers/:id - Get career by ID
export const getCareerById = asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const career = await prisma.career.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          applications: true
        }
      },
      applications: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          resumeUrl: true,
          createdAt: true
        }
      }
    }
  })
  
  if (!career) {
    return res.status(404).json({
      success: false,
      message: 'Career not found'
    })
  }
  
  res.json({
    success: true,
    data: career
  })
})

// POST /api/careers - Create new career
export const createCareer = [
  ...careerValidationRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { title, description, location, employmentType, isActive = true } = req.body
    
    const career = await prisma.career.create({
      data: {
        title,
        description,
        location,
        employmentType,
        isActive
      }
    })
    
    res.status(201).json({
      success: true,
      message: 'Career created successfully',
      data: career
    })
  })
]

// PUT /api/careers/:id - Update career
export const updateCareer = [
  param('id').isUUID().withMessage('Valid career ID is required'),
  ...careerValidationRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { title, description, location, employmentType, isActive } = req.body
    
    const existingCareer = await prisma.career.findUnique({
      where: { id }
    })
    
    if (!existingCareer) {
      return res.status(404).json({
        success: false,
        message: 'Career not found'
      })
    }
    
    const career = await prisma.career.update({
      where: { id },
      data: {
        title,
        description,
        location,
        employmentType,
        isActive
      }
    })
    
    res.json({
      success: true,
      message: 'Career updated successfully',
      data: career
    })
  })
]

// DELETE /api/careers/:id - Delete career
export const deleteCareer = asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const career = await prisma.career.findUnique({
    where: { id }
  })
  
  if (!career) {
    return res.status(404).json({
      success: false,
      message: 'Career not found'
    })
  }
  
  await prisma.career.delete({
    where: { id }
  })
  
  res.json({
    success: true,
    message: 'Career deleted successfully'
  })
})

// GET /api/careers/public - Get public careers (simplified method for frontend)
export const getPublicCareers = asyncHandler(async (req, res) => {
  try {
    const careers = await prisma.career.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: careers
    });
  } catch (error) {
    console.error('Error fetching public careers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching careers',
      error: error.message
    });
  }
})

// GET /api/career-applications - Get all career applications
export const getCareerApplications = asyncHandler(async (req, res) => {
  const { careerId } = req.query
  const { page, limit, skip } = parsePageLimit(req.query, { defaultLimit: 10, maxLimit: 100 })
  
  const where = {}
  if (careerId) {
    where.careerId = careerId
  }
  
  const [applications, total] = await Promise.all([
    prisma.careerApplication.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        career: {
          select: {
            id: true,
            title: true,
            location: true,
            employmentType: true
          }
        }
      }
    }),
    prisma.careerApplication.count({ where })
  ])
  
  res.json({
    success: true,
    data: applications,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit
    }
  })
})

// GET /api/career-applications/:id - Get application by ID
export const getCareerApplicationById = asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const application = await prisma.careerApplication.findUnique({
    where: { id },
    include: {
      career: {
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          employmentType: true
        }
      }
    }
  })
  
  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Career application not found'
    })
  }
  
  res.json({
    success: true,
    data: application
  })
})

// POST /api/career-applications - Create new application (for admin to manually add)
export const createCareerApplication = [
  body('careerId').isUUID().withMessage('Valid career ID is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  validateRequest,
  asyncHandler(async (req, res) => {
    const { careerId, name, email, phone, resumeUrl } = req.body
    
    // Check if career exists
    const career = await prisma.career.findUnique({
      where: { id: careerId }
    })
    
    if (!career) {
      return res.status(404).json({
        success: false,
        message: 'Career not found'
      })
    }
    
    const application = await prisma.careerApplication.create({
      data: {
        careerId,
        name,
        email,
        phone,
        resumeUrl: resumeUrl || null
      }
    })
    
    res.status(201).json({
      success: true,
      message: 'Career application created successfully',
      data: application
    })
  })
]

// DELETE /api/career-applications/:id - Delete application
export const deleteCareerApplication = asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const application = await prisma.careerApplication.findUnique({
    where: { id }
  })
  
  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Career application not found'
    })
  }
  
  await prisma.careerApplication.delete({
    where: { id }
  })
  
  res.json({
    success: true,
    message: 'Career application deleted successfully'
  })
})