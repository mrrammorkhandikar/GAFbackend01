import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../middleware/errorHandler.js'
import { uploadImage, generateFileName } from '../middleware/upload.js'
import { uploadFile, deleteFile } from '../config/supabase.js'
import { body, param, query } from 'express-validator'
import { validateRequest } from '../middleware/errorHandler.js'
import { getBucketConfig } from '../config/storage.js'

const prisma = new PrismaClient()

// Validation rules
const campaignValidationRules = [
  body('title').notEmpty().withMessage('Title is required'),
  body('slug').notEmpty().withMessage('Slug is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required')
]

// GET /api/campaigns - Get all campaigns
export const getCampaigns = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, active, isActive } = req.query
  
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const skip = (pageNum - 1) * limitNum
  
  const where = {}
  // Check for both 'active' and 'isActive' query parameters
  if (active !== undefined || isActive !== undefined) {
    where.isActive = (active === 'true' || isActive === 'true')
  }
  
  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        events: {
          where: { isActive: true },
          take: 3
        }
      }
    }),
    prisma.campaign.count({ where })
  ])
  
  res.json({
    success: true,
    data: campaigns,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum
    }
  })
})

// GET /api/campaigns/:id - Get campaign by ID
export const getCampaignById = asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      events: {
        where: { isActive: true },
        orderBy: { eventDate: 'asc' }
      }
    }
  })
  
  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    })
  }
  
  res.json({
    success: true,
    data: campaign
  })
})

// POST /api/campaigns - Create new campaign
export const createCampaign = [
  uploadImage.fields([
    { name: 'image', maxCount: 1 },
    { name: 'galleryImage_0', maxCount: 1 },
    { name: 'galleryImage_1', maxCount: 1 },
    { name: 'galleryImage_2', maxCount: 1 },
    { name: 'galleryImage_3', maxCount: 1 }
  ]),
  ...campaignValidationRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { title, slug, description, content, startDate, endDate, location, amount, raisedAmount } = req.body
    
    // Check if slug already exists
    const existingCampaign = await prisma.campaign.findUnique({
      where: { slug }
    })
    
    if (existingCampaign) {
      return res.status(409).json({
        success: false,
        message: 'Campaign with this slug already exists'
      })
    }
    
    let imageUrl = null
    const files = req.files || {}
    
    if (files.image?.[0]) {
      try {
        const fileName = generateFileName(files.image[0].originalname, 'campaign-')
        const bucketName = getBucketConfig('campaigns')
        const uploadResult = await uploadFile(bucketName, fileName, files.image[0].buffer, files.image[0].mimetype)
        imageUrl = uploadResult.url
      } catch (error) {
        console.error('Error uploading featured image:', error)
      }
    }
    
    // Parse existing content and merge gallery uploads
    let parsedContent = null
    try {
      parsedContent = content ? JSON.parse(content) : {}
    } catch {
      parsedContent = {}
    }
    
    // Upload gallery images and merge with any existing gallery URLs
    const galleryUrls = Array.isArray(parsedContent.impactGallery) ? [...parsedContent.impactGallery] : []
    for (let i = 0; i < 4; i++) {
      const galleryFile = files[`galleryImage_${i}`]?.[0]
      if (galleryFile) {
        try {
          const fileName = generateFileName(galleryFile.originalname, `gallery-${i}-`)
          const bucketName = getBucketConfig('campaigns')
          const uploadResult = await uploadFile(bucketName, fileName, galleryFile.buffer, galleryFile.mimetype)
          while (galleryUrls.length <= i) galleryUrls.push(null)
          galleryUrls[i] = uploadResult.url
        } catch (error) {
          console.error(`Error uploading gallery image ${i}:`, error)
        }
      }
    }
    
    const finalContent = {
      ...parsedContent,
      impactGallery: galleryUrls.filter(Boolean)
    }
    
    const campaign = await prisma.campaign.create({
      data: {
        title,
        slug,
        description,
        location: location || '',
        amount: amount ? parseInt(amount) : null,
        raisedAmount: raisedAmount ? parseInt(raisedAmount) : null,
        content: Object.keys(finalContent).length > 0 ? finalContent : null,
        imageUrl,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null
      }
    })
    
    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign
    })
  })
]

// PUT /api/campaigns/:id - Update campaign
export const updateCampaign = [
  uploadImage.fields([
    { name: 'image', maxCount: 1 },
    { name: 'galleryImage_0', maxCount: 1 },
    { name: 'galleryImage_1', maxCount: 1 },
    { name: 'galleryImage_2', maxCount: 1 },
    { name: 'galleryImage_3', maxCount: 1 }
  ]),
  param('id').isUUID().withMessage('Valid campaign ID is required'),
  ...campaignValidationRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { title, slug, description, content, startDate, endDate, isActive, location, amount, raisedAmount } = req.body
    
    // Check if campaign exists
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id }
    })
    
    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      })
    }
    
    // Check if new slug already exists (excluding current campaign)
    if (slug && slug !== existingCampaign.slug) {
      const duplicateCampaign = await prisma.campaign.findUnique({
        where: { slug }
      })
      
      if (duplicateCampaign) {
        return res.status(409).json({
          success: false,
          message: 'Campaign with this slug already exists'
        })
      }
    }
    
    const files = req.files || {}
    let imageUrl = existingCampaign.imageUrl
    
    if (files.image?.[0]) {
      try {
        if (existingCampaign.imageUrl) {
          const oldFileName = existingCampaign.imageUrl.split('/').pop()
          await deleteFile(getBucketConfig('campaigns'), oldFileName)
        }
        const fileName = generateFileName(files.image[0].originalname, 'campaign-')
        const bucketName = getBucketConfig('campaigns')
        const uploadResult = await uploadFile(bucketName, fileName, files.image[0].buffer, files.image[0].mimetype)
        imageUrl = uploadResult.url
      } catch (error) {
        console.error('Error uploading featured image:', error)
      }
    }
    
    // Parse content and merge gallery uploads
    let parsedContent = null
    try {
      parsedContent = content ? JSON.parse(content) : (existingCampaign.content || {})
    } catch {
      parsedContent = existingCampaign.content || {}
    }
    
    const galleryUrls = Array.isArray(parsedContent.impactGallery) ? [...parsedContent.impactGallery] : []
    for (let i = 0; i < 4; i++) {
      const galleryFile = files[`galleryImage_${i}`]?.[0]
      if (galleryFile) {
        try {
          const fileName = generateFileName(galleryFile.originalname, `gallery-${i}-`)
          const bucketName = getBucketConfig('campaigns')
          const uploadResult = await uploadFile(bucketName, fileName, galleryFile.buffer, galleryFile.mimetype)
          while (galleryUrls.length <= i) galleryUrls.push(null)
          galleryUrls[i] = uploadResult.url
        } catch (error) {
          console.error(`Error uploading gallery image ${i}:`, error)
        }
      }
    }
    
    const finalContent = {
      ...parsedContent,
      impactGallery: galleryUrls.filter(Boolean)
    }
    
    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        location: location || existingCampaign.location,
        amount: amount !== undefined ? (amount ? parseInt(amount) : null) : existingCampaign.amount,
        raisedAmount: raisedAmount !== undefined ? (raisedAmount ? parseInt(raisedAmount) : null) : existingCampaign.raisedAmount,
        content: Object.keys(finalContent).length > 0 ? finalContent : null,
        imageUrl,
        startDate: startDate ? new Date(startDate) : existingCampaign.startDate,
        endDate: endDate ? new Date(endDate) : existingCampaign.endDate,
        isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : existingCampaign.isActive
      }
    })
    
    res.json({
      success: true,
      message: 'Campaign updated successfully',
      data: campaign
    })
  })
]

// DELETE /api/campaigns/:id - Delete campaign
export const deleteCampaign = asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const campaign = await prisma.campaign.findUnique({
    where: { id }
  })
  
  if (!campaign) {
    return res.status(404).json({
      success: false,
      message: 'Campaign not found'
    })
  }
  
  // Delete image from storage if exists
  if (campaign.imageUrl) {
    try {
      const fileName = campaign.imageUrl.split('/').pop()
      await deleteFile(getBucketConfig('campaigns'), fileName)
    } catch (error) {
      console.error('Error deleting image:', error)
    }
  }
  
  await prisma.campaign.delete({
    where: { id }
  })
  
  res.json({
    success: true,
    message: 'Campaign deleted successfully'
  })
})

// GET /api/campaigns/public - Get public campaigns (simplified method for frontend)
export const getPublicCampaigns = asyncHandler(async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    console.error('Error fetching public campaigns:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching campaigns',
      error: error.message
    });
  }
})
