import prisma from '../lib/prisma.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { body, param } from 'express-validator'
import { validateRequest } from '../middleware/errorHandler.js'
import {
  sendEventRegistrationAdminAlert,
  sendEventRegistrationApproved
} from '../config/email.js'

// Validation rules for event registration (admin create)
const registrationValidationRules = [
  body('eventId').isUUID().withMessage('Valid event ID is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('mobile').notEmpty().withMessage('Mobile number is required')
]

const publicSubmitRules = [
  body('eventId').isUUID().withMessage('Valid event ID is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('mobile').trim().notEmpty().withMessage('Mobile number is required'),
  body('amount')
    .custom((value) => {
      const n = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''))
      return !Number.isNaN(n) && n >= 0
    })
    .withMessage('Valid amount is required'),
  body('currency').optional().isLength({ min: 3, max: 3 }),
  body('address').optional({ nullable: true }).isString()
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

/** POST /api/event-registrations/submit — public; pending until admin approves */
export const submitPublicEventRegistration = [
  ...publicSubmitRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { eventId, name, email, mobile, amount, currency = 'INR', address } = req.body
    const amountNum = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/,/g, ''))

    const event = await prisma.event.findUnique({ where: { id: eventId } })

    if (!event || !event.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      })
    }

    if (!event.registrationEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Registration is not open for this event'
      })
    }

    if (new Date(event.eventDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This event has already taken place'
      })
    }

    const fee = Number(event.registrationFee) || 0
    if (fee > 0) {
      if (Math.abs(amountNum - fee) > 0.02) {
        return res.status(400).json({
          success: false,
          message: 'Amount must match the event registration fee'
        })
      }
    } else if (amountNum !== 0) {
      return res.status(400).json({
        success: false,
        message: 'This event has no registration fee'
      })
    }

    const existingRegistration = await prisma.eventRegistration.findFirst({
      where: {
        eventId,
        email,
        status: { in: ['pending', 'completed'] }
      }
    })

    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message: 'You already have a registration for this event with this email'
      })
    }

    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        name,
        email,
        mobile,
        address: address?.trim() || null,
        amount: amountNum,
        currency,
        status: 'pending'
      },
      include: {
        event: { select: { id: true, title: true, slug: true } }
      }
    })

    sendEventRegistrationAdminAlert(name, email, mobile, event.title, amountNum, currency).catch(console.error)

    res.status(201).json({
      success: true,
      message:
        'Registration submitted. Our team will verify your payment where applicable and email you once it is approved.',
      data: registration
    })
  })
]

// POST /api/event-registrations - Admin: manual registration (pre-approved)
export const createEventRegistration = [
  ...registrationValidationRules,
  body('address').optional({ nullable: true }).isString(),
  body('amount').optional({ values: 'falsy' }).isFloat({ min: 0 }),
  validateRequest,
  asyncHandler(async (req, res) => {
    const { eventId, name, email, mobile, address, amount } = req.body

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      })
    }

    const existingRegistration = await prisma.eventRegistration.findFirst({
      where: {
        eventId,
        email,
        status: { in: ['pending', 'completed'] }
      }
    })

    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message: 'Registration already exists for this email'
      })
    }

    const amt =
      amount !== undefined && amount !== null && amount !== ''
        ? parseFloat(amount)
        : Number(event.registrationFee) || 0

    const registration = await prisma.eventRegistration.create({
      data: {
        eventId,
        name,
        email,
        mobile,
        address: address?.trim() || null,
        amount: amt,
        currency: 'INR',
        status: 'completed'
      }
    })

    res.status(201).json({
      success: true,
      message: 'Registration created successfully',
      data: registration
    })
  })
]

// PATCH /api/event-registrations/:id/status
export const updateEventRegistrationStatus = [
  param('id').isUUID().withMessage('Valid registration ID is required'),
  body('status').isIn(['pending', 'completed', 'rejected']).withMessage('Invalid status'),
  validateRequest,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { status } = req.body

    const registration = await prisma.eventRegistration.findUnique({
      where: { id },
      include: {
        event: { select: { id: true, title: true, slug: true } }
      }
    })

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      })
    }

    const wasCompleted = registration.status === 'completed'
    const becomingCompleted = status === 'completed' && !wasCompleted

    const updated = await prisma.eventRegistration.update({
      where: { id },
      data: { status },
      include: {
        event: { select: { id: true, title: true, slug: true } }
      }
    })

    if (becomingCompleted && registration.email) {
      sendEventRegistrationApproved(
        registration.email,
        registration.name,
        registration.event.title,
        registration.amount,
        registration.currency
      ).catch(console.error)
    }

    res.json({
      success: true,
      message: 'Registration status updated',
      data: updated
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
