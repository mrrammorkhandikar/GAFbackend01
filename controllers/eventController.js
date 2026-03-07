import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../middleware/errorHandler.js'
import { uploadImage, generateFileName } from '../middleware/upload.js'
import { uploadFile, deleteFile } from '../config/supabase.js'
import { body, param } from 'express-validator'
import { validateRequest } from '../middleware/errorHandler.js'
import { getBucketConfig } from '../config/storage.js'

const prisma = new PrismaClient()

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
  
  res.json({
    success: true,
    data: events,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum
    }
  })
})

// GET /api/events/:id - Get event by ID
export const getEventById = asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const event = await prisma.event.findUnique({
    where: { id },
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
  
  res.json({
    success: true,
    data: event
  })
})

// POST /api/events - Create new event
export const createEvent = [
  uploadImage.single('image'),
  ...eventValidationRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { title, slug, description, content, eventDate, location, campaignId } = req.body
    
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
        campaignId: campaignId || null
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
        isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : existingEvent.isActive
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
    });

    res.json({
      success: true,
      data: events
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
