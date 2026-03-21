import prisma from '../lib/prisma.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { uploadImage, generateFileName } from '../middleware/upload.js'
import { uploadFile, deleteFile } from '../config/supabase.js'
import { body, param } from 'express-validator'
import { validateRequest } from '../middleware/errorHandler.js'
import { getBucketConfig } from '../config/storage.js'

const parseBool = (v, defaultValue = false) => {
  if (v === undefined || v === null || v === '') return defaultValue
  return v === true || v === 'true' || v === '1' || v === 1
}

async function attachRegistrationCounts(events) {
  if (!events.length) return events
  const ids = events.map((e) => e.id)
  const counts = await prisma.eventRegistration.groupBy({
    by: ['eventId'],
    where: { eventId: { in: ids }, status: 'completed' },
    _count: { _all: true }
  })
  const countMap = Object.fromEntries(counts.map((c) => [c.eventId, c._count._all]))
  return events.map((e) => ({ ...e, registrationCount: countMap[e.id] ?? 0 }))
}

// Validation rules
const eventValidationRules = [
  body('title').notEmpty().withMessage('Title is required'),
  body('slug').notEmpty().withMessage('Slug is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('eventDate').isISO8601().withMessage('Valid event date is required'),
  body('location').notEmpty().withMessage('Location is required')
]

// GET /api/events - Get all events
export const getEvents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, active, isActive, upcoming, campaignId } = req.query
  
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const skip = (pageNum - 1) * limitNum
  
  const where = {}
  // Check for both 'active' and 'isActive' query parameters
  if (active !== undefined || isActive !== undefined) {
    where.isActive = (active === 'true' || isActive === 'true')
  }
  
  // Handle upcoming events filter
  if (upcoming === 'true') {
    where.eventDate = {
      gte: new Date()
    }
  }
  
  if (campaignId) {
    where.campaignId = campaignId
  }
  
  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { eventDate: 'asc' },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    }),
    prisma.event.count({ where })
  ])

  const data = await attachRegistrationCounts(events)

  res.json({
    success: true,
    data,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum
    }
  })
})

// UUID v4 pattern
const isUuid = (s) => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)

// GET /api/events/:idOrSlug - Get event by ID or slug (slug for pretty URLs)
export const getEventById = asyncHandler(async (req, res) => {
  const { id: idOrSlug } = req.params
  const where = isUuid(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug }

  const event = await prisma.event.findUnique({
    where,
    include: {
      campaign: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true
        }
      }
    }
  })

  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    })
  }

  const registrationCount = await prisma.eventRegistration.count({
    where: { eventId: event.id, status: 'completed' }
  })

  res.json({
    success: true,
    data: { ...event, registrationCount }
  })
})

// POST /api/events - Create new event
export const createEvent = [
  uploadImage.single('image'),
  ...eventValidationRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { title, slug, description, content, eventDate, location, campaignId } = req.body
    const registrationEnabled = parseBool(req.body.registrationEnabled)
    const registrationFee = registrationEnabled
      ? Math.max(0, parseFloat(String(req.body.registrationFee ?? 0).replace(/,/g, '')) || 0)
      : 0

    // Check if slug already exists
    const existingEvent = await prisma.event.findUnique({
      where: { slug }
    })
    
    if (existingEvent) {
      return res.status(409).json({
        success: false,
        message: 'Event with this slug already exists'
      })
    }
    
    // Validate campaign exists if provided
    if (campaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId }
      })
      
      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        })
      }
    }
    
    let imageUrl = null
    if (req.file) {
      try {
        const fileName = generateFileName(req.file.originalname, 'event-')
        const bucketName = getBucketConfig('events')
        
        const uploadResult = await uploadFile(
          bucketName,
          fileName,
          req.file.buffer,
          req.file.mimetype
        )
        imageUrl = uploadResult.url
      } catch (error) {
        console.error('Error uploading image:', error)
      }
    }
    
    const event = await prisma.event.create({
      data: {
        title,
        slug,
        description,
        content: content || null,
        imageUrl,
        eventDate: new Date(eventDate),
        location,
        campaignId: campaignId || null,
        registrationEnabled,
        registrationFee
      }
    })
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    })
  })
]

// PUT /api/events/:id - Update event
export const updateEvent = [
  uploadImage.single('image'),
  param('id').isUUID().withMessage('Valid event ID is required'),
  ...eventValidationRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { title, slug, description, content, eventDate, location, campaignId, isActive } = req.body

    const existingEvent = await prisma.event.findUnique({
      where: { id }
    })
    
    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      })
    }

    const registrationEnabled = parseBool(req.body.registrationEnabled, existingEvent.registrationEnabled ?? false)
    const registrationFee = registrationEnabled
      ? Math.max(0, parseFloat(String(req.body.registrationFee ?? 0).replace(/,/g, '')) || 0)
      : 0
    
    // Check if new slug already exists
    if (slug && slug !== existingEvent.slug) {
      const duplicateEvent = await prisma.event.findUnique({
        where: { slug }
      })
      
      if (duplicateEvent) {
        return res.status(409).json({
          success: false,
          message: 'Event with this slug already exists'
        })
      }
    }
    
    // Validate campaign exists if provided
    if (campaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId }
      })
      
      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        })
      }
    }
    
    let imageUrl = existingEvent.imageUrl
    if (req.file) {
      try {
        if (existingEvent.imageUrl) {
          const oldFileName = existingEvent.imageUrl.split('/').pop()
          await deleteFile(getBucketConfig('events'), oldFileName)
        }
        
        const fileName = generateFileName(req.file.originalname, 'event-')
        const bucketName = getBucketConfig('events')
        
        const uploadResult = await uploadFile(
          bucketName,
          fileName,
          req.file.buffer,
          req.file.mimetype
        )
        imageUrl = uploadResult.url
      } catch (error) {
        console.error('Error uploading image:', error)
      }
    }
    
    const event = await prisma.event.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        content: content || null,
        imageUrl,
        eventDate: eventDate ? new Date(eventDate) : existingEvent.eventDate,
        location,
        campaignId: campaignId !== undefined ? campaignId : existingEvent.campaignId,
        isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : existingEvent.isActive,
        registrationEnabled,
        registrationFee
      }
    })
    
    res.json({
      success: true,
      message: 'Event updated successfully',
      data: event
    })
  })
]

// DELETE /api/events/:id - Delete event
export const deleteEvent = asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const event = await prisma.event.findUnique({
    where: { id }
  })
  
  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found'
    })
  }
  
  if (event.imageUrl) {
    try {
      const fileName = event.imageUrl.split('/').pop()
      await deleteFile(getBucketConfig('events'), fileName)
    } catch (error) {
      console.error('Error deleting image:', error)
    }
  }
  
  await prisma.event.delete({
    where: { id }
  })
  
  res.json({
    success: true,
    message: 'Event deleted successfully'
  })
})

// GET /api/events/public - Get public events (simplified method for frontend)
export const getPublicEvents = asyncHandler(async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { isActive: true },
      orderBy: { eventDate: 'asc' }
    })
    const data = await attachRegistrationCounts(events)

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching public events:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
      error: error.message
    });
  }
})
