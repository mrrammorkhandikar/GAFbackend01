import prisma from '../lib/prisma.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { uploadImage, generateFileName } from '../middleware/upload.js'
import { uploadFile, deleteFile } from '../config/supabase.js'
import { body, param } from 'express-validator'
import { validateRequest } from '../middleware/errorHandler.js'
import { getBucketConfig } from '../config/storage.js'

// Validation rules for partner
const partnerValidationRules = [
  body('name').notEmpty().withMessage('Name is required'),
  body('slug').notEmpty().withMessage('Slug is required'),
  body('shortDescription').notEmpty().withMessage('Short description is required'),
  body('type').notEmpty().withMessage('Partner type is required'),
]

// Build content JSON from request body (for storytelling)
const buildPartnerContent = (req) => {
  const { content, about, programs, highlights, quoteText, quoteAuthor, quoteRole } = req.body

  if (content) {
    // If frontend already sends a content object, use it as-is
    return content
  }

  const result = {}

  if (about) {
    result.about = Array.isArray(about)
      ? about
      : String(about)
          .split('\n')
          .map((p) => p.trim())
          .filter(Boolean)
  }

  if (programs) {
    result.programs = Array.isArray(programs)
      ? programs
      : String(programs)
          .split('\n')
          .map((p) => p.trim())
          .filter(Boolean)
  }

  if (highlights) {
    result.highlights = Array.isArray(highlights)
      ? highlights
      : String(highlights)
          .split('\n')
          .map((p) => p.trim())
          .filter(Boolean)
  }

  if (quoteText) {
    result.quote = {
      text: quoteText,
      author: quoteAuthor || undefined,
      role: quoteRole || undefined,
    }
  }

  return Object.keys(result).length > 0 ? result : null
}

// GET /api/partners - Get all partners (admin)
export const getPartners = asyncHandler(async (req, res) => {
  // Graceful fallback if Prisma client has not been regenerated yet
  if (!prisma.partner || typeof prisma.partner.findMany !== 'function') {
    console.warn('Partner model not available on Prisma client. Returning empty list.')
    return res.json({
      success: true,
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 10,
      },
    })
  }

  const { page = 1, limit = 10, isActive, featured } = req.query

  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const skip = (pageNum - 1) * limitNum

  const where = {}

  if (isActive !== undefined) {
    where.isActive = isActive === 'true'
  }

  if (featured !== undefined) {
    where.isFeatured = featured === 'true'
  }

  const [partners, total] = await Promise.all([
    prisma.partner.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.partner.count({ where }),
  ])

  res.json({
    success: true,
    data: partners,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum,
    },
  })
})

// GET /api/partners/:id - Get partner by ID (admin)
export const getPartnerById = asyncHandler(async (req, res) => {
  if (!prisma.partner || typeof prisma.partner.findUnique !== 'function') {
    return res.status(503).json({
      success: false,
      message: 'Partner model not available on Prisma client. Run migrations and regenerate Prisma.',
    })
  }

  const { id } = req.params

  const partner = await prisma.partner.findUnique({
    where: { id },
  })

  if (!partner) {
    return res.status(404).json({
      success: false,
      message: 'Partner not found',
    })
  }

  res.json({
    success: true,
    data: partner,
  })
})

// GET /api/partners/public - Public list of partners
export const getPublicPartners = asyncHandler(async (req, res) => {
  // If Prisma client is not yet aware of Partner, avoid 500 and just return empty list
  if (!prisma.partner || typeof prisma.partner.findMany !== 'function') {
    console.warn('Partner model not available on Prisma client. Returning empty public list.')
    return res.json({
      success: true,
      data: [],
    })
  }

  try {
    const partners = await prisma.partner.findMany({
      where: { isActive: true },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    res.json({
      success: true,
      data: partners,
    })
  } catch (error) {
    console.error('Error fetching public partners:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching partners',
      error: error.message,
    })
  }
})

// GET /api/partners/public/:slug - Public partner detail by slug
export const getPublicPartnerBySlug = asyncHandler(async (req, res) => {
  if (!prisma.partner || typeof prisma.partner.findFirst !== 'function') {
    return res.status(503).json({
      success: false,
      message: 'Partner model not available on Prisma client. Run migrations and regenerate Prisma.',
    })
  }

  const { slug } = req.params

  const partner = await prisma.partner.findFirst({
    where: {
      slug,
      isActive: true,
    },
  })

  if (!partner) {
    return res.status(404).json({
      success: false,
      message: 'Partner not found',
    })
  }

  res.json({
    success: true,
    data: partner,
  })
})

// POST /api/partners - Create new partner
export const createPartner = [
  uploadImage.single('logo'),
  ...partnerValidationRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    if (!prisma.partner || typeof prisma.partner.findUnique !== 'function') {
      return res.status(503).json({
        success: false,
        message: 'Partner database model is not available. Run: npx prisma migrate deploy && npx prisma generate',
      })
    }

    const {
      name,
      slug,
      type,
      shortDescription,
      websiteUrl,
      country,
      city,
      isFeatured = false,
      isActive = true,
    } = req.body

    // Check if slug already exists
    const existingPartner = await prisma.partner.findUnique({
      where: { slug },
    })

    if (existingPartner) {
      return res.status(409).json({
        success: false,
        message: 'Partner with this slug already exists',
      })
    }

    let logoUrl = null
    if (req.file) {
      try {
        const fileName = generateFileName(req.file.originalname, 'partner-')
        const bucketName = getBucketConfig('partners')

        const uploadResult = await uploadFile(
          bucketName,
          fileName,
          req.file.buffer,
          req.file.mimetype,
        )
        logoUrl = uploadResult.url
      } catch (error) {
        console.error('Error uploading partner logo:', error)
      }
    }

    const content = buildPartnerContent(req)

    const partner = await prisma.partner.create({
      data: {
        name,
        slug,
        type,
        shortDescription,
        websiteUrl: websiteUrl || null,
        country: country || null,
        city: city || null,
        isFeatured: isFeatured === 'true' || isFeatured === true,
        isActive: isActive === 'true' || isActive === true,
        logoUrl,
        content: content || undefined,
      },
    })

    res.status(201).json({
      success: true,
      message: 'Partner created successfully',
      data: partner,
    })
  }),
]

// PUT /api/partners/:id - Update partner
export const updatePartner = [
  uploadImage.single('logo'),
  param('id').isUUID().withMessage('Valid partner ID is required'),
  ...partnerValidationRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    if (!prisma.partner || typeof prisma.partner.findUnique !== 'function') {
      return res.status(503).json({
        success: false,
        message: 'Partner database model is not available. Run: npx prisma migrate deploy && npx prisma generate',
      })
    }

    const { id } = req.params
    const {
      name,
      slug,
      type,
      shortDescription,
      websiteUrl,
      country,
      city,
      isFeatured,
      isActive,
    } = req.body

    const existingPartner = await prisma.partner.findUnique({
      where: { id },
    })

    if (!existingPartner) {
      return res.status(404).json({
        success: false,
        message: 'Partner not found',
      })
    }

    // Check slug uniqueness
    if (slug && slug !== existingPartner.slug) {
      const duplicatePartner = await prisma.partner.findUnique({
        where: { slug },
      })

      if (duplicatePartner) {
        return res.status(409).json({
          success: false,
          message: 'Partner with this slug already exists',
        })
      }
    }

    let logoUrl = existingPartner.logoUrl
    if (req.file) {
      try {
        if (existingPartner.logoUrl) {
          const oldFileName = existingPartner.logoUrl.split('/').pop()
          await deleteFile(getBucketConfig('partners'), oldFileName)
        }

        const fileName = generateFileName(req.file.originalname, 'partner-')
        const bucketName = getBucketConfig('partners')

        const uploadResult = await uploadFile(
          bucketName,
          fileName,
          req.file.buffer,
          req.file.mimetype,
        )
        logoUrl = uploadResult.url
      } catch (error) {
        console.error('Error uploading partner logo:', error)
      }
    }

    const content = buildPartnerContent(req)

    const partner = await prisma.partner.update({
      where: { id },
      data: {
        name,
        slug,
        type,
        shortDescription,
        websiteUrl: websiteUrl || null,
        country: country || null,
        city: city || null,
        isFeatured:
          isFeatured !== undefined
            ? isFeatured === 'true' || isFeatured === true
            : existingPartner.isFeatured,
        isActive:
          isActive !== undefined
            ? isActive === 'true' || isActive === true
            : existingPartner.isActive,
        logoUrl,
        content: content || existingPartner.content,
      },
    })

    res.json({
      success: true,
      message: 'Partner updated successfully',
      data: partner,
    })
  }),
]

// DELETE /api/partners/:id - Delete partner
export const deletePartner = asyncHandler(async (req, res) => {
  if (!prisma.partner || typeof prisma.partner.findUnique !== 'function') {
    return res.status(503).json({
      success: false,
      message: 'Partner database model is not available. Run: npx prisma migrate deploy && npx prisma generate',
    })
  }

  const { id } = req.params

  const partner = await prisma.partner.findUnique({
    where: { id },
  })

  if (!partner) {
    return res.status(404).json({
      success: false,
      message: 'Partner not found',
    })
  }

  if (partner.logoUrl) {
    try {
      const fileName = partner.logoUrl.split('/').pop()
      await deleteFile(getBucketConfig('partners'), fileName)
    } catch (error) {
      console.error('Error deleting partner logo:', error)
    }
  }

  await prisma.partner.delete({
    where: { id },
  })

  res.json({
    success: true,
    message: 'Partner deleted successfully',
  })
})

