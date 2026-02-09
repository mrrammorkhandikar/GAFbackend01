import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../middleware/errorHandler.js'
import { body, param } from 'express-validator'
import { validateRequest } from '../middleware/errorHandler.js'

const prisma = new PrismaClient()

// Validation rules for event registration
const registrationValidationRules = [
  body('eventId').isUUID().withMessage('Valid event ID is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('mobile').notEmpty().withMessage('Mobile number is required')
]

// GET /api/event-registrations - Get all event registrations
export const getEventRegistrations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, eventId } = req.query
  
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const skip = (pageNum - 1) * limitNum
  
  const where = {}
  if (eventId) {
    where.eventId = eventId
  }
  
  const [registrations, total] = await Promise.all([
    prisma.eventRegistration.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            eventDate: true
          }
        }
      }
    }),
    prisma.eventRegistration.count({ where })
  ])
  
  res.json({
    success: true,
    data: registrations,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum
    }
  })
})

// GET /api/event-registrations/:id - Get registration by ID
export const getEventRegistrationById = asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const registration = await prisma.eventRegistration.findUnique({
    where: { id },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          eventDate: true,
          location: true
        }
      }
    }
  })
  
  if (!registration) {
    return res.status(404).json({
      success: false,
      message: 'Registration not found'
    })
  }
  
  res.json({
    success: true,
    data: registration
  })
})

// POST /api/event-registrations - Create new registration (for admin to manually add)
export const createEventRegistration = [
  ...registrationValidationRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { eventId, name, email, mobile } = req.body
    
    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    })
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      })
    }
    
    // Check if registration already exists
    const existingRegistration = await prisma.eventRegistration.findFirst({
      where: {
        eventId,
        email
      }
    })
    
    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message: 'Registration already exists for this email'
      })
    }
    
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        name,
        email,
        mobile
      }
    })
    
    res.status(201).json({
      success: true,
      message: 'Registration created successfully',
      data: registration
    })
  })
]

// DELETE /api/event-registrations/:id - Delete registration
export const deleteEventRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const registration = await prisma.eventRegistration.findUnique({
    where: { id }
  })
  
  if (!registration) {
    return res.status(404).json({
      success: false,
      message: 'Registration not found'
    })
  }
  
  await prisma.eventRegistration.delete({
    where: { id }
  })
  
  res.json({
    success: true,
    message: 'Registration deleted successfully'
  })
})