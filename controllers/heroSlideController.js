import prisma from '../lib/prisma.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { uploadImage, generateFileName } from '../middleware/upload.js'
import { uploadFile, deleteFile } from '../config/supabase.js'
import { body, param } from 'express-validator'
import { validateRequest } from '../middleware/errorHandler.js'
import { getBucketConfig } from '../config/storage.js'

const heroSlideValidationRules = [
  body('title').optional().isString(),
  body('sortOrder').optional().isInt({ min: 0 }).toInt(),
  body('isActive').optional().isBoolean().toBoolean()
]

// GET /api/hero-slides - List (admin: all, with pagination)
export const getHeroSlides = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, isActive } = req.query
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const skip = (pageNum - 1) * limitNum

  const where = {}
  if (isActive !== undefined) {
    where.isActive = isActive === 'true'
  }

  const [slides, total] = await Promise.all([
    prisma.heroSlide.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
    }),
    prisma.heroSlide.count({ where })
  ])

  res.json({
    success: true,
    data: slides,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum
    }
  })
})

// GET /api/hero-slides/:id
export const getHeroSlideById = asyncHandler(async (req, res) => {
  const { id } = req.params
  const slide = await prisma.heroSlide.findUnique({ where: { id } })
  if (!slide) {
    return res.status(404).json({ success: false, message: 'Hero slide not found' })
  }
  res.json({ success: true, data: slide })
})

// POST /api/hero-slides - Create
export const createHeroSlide = [
  uploadImage.single('image'),
  body('imageUrl').optional().isString(), // allow URL if no file
  ...heroSlideValidationRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { title, sortOrder = 0, isActive = true, imageUrl: urlFromBody } = req.body

    let imageUrl = urlFromBody || null
    if (req.file) {
      const fileName = generateFileName(req.file.originalname, 'hero-')
      const bucketName = getBucketConfig('heroSlides')
      const uploadResult = await uploadFile(
        bucketName,
        fileName,
        req.file.buffer,
        req.file.mimetype
      )
      imageUrl = uploadResult.url
    }

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image is required (upload a file or provide imageUrl)'
      })
    }

    const slide = await prisma.heroSlide.create({
      data: {
        imageUrl,
        title: title || null,
        sortOrder: parseInt(sortOrder) || 0,
        isActive: isActive === true || isActive === 'true'
      }
    })
    res.status(201).json({ success: true, data: slide })
  })
]

// PUT /api/hero-slides/:id - Update
export const updateHeroSlide = [
  uploadImage.single('image'),
  param('id').isUUID(),
  body('title').optional().isString(),
  body('sortOrder').optional().isInt({ min: 0 }).toInt(),
  body('isActive').optional().isBoolean().toBoolean(),
  validateRequest,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { title, sortOrder, isActive } = req.body

    const existing = await prisma.heroSlide.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Hero slide not found' })
    }

    let imageUrl = existing.imageUrl
    if (req.file) {
      const oldFileName = existing.imageUrl?.split('/').pop()
      if (oldFileName) {
        try {
          await deleteFile(getBucketConfig('heroSlides'), oldFileName)
        } catch (e) {
          console.warn('Could not delete old hero slide image:', e.message)
        }
      }
      const fileName = generateFileName(req.file.originalname, 'hero-')
      const bucketName = getBucketConfig('heroSlides')
      const uploadResult = await uploadFile(
        bucketName,
        fileName,
        req.file.buffer,
        req.file.mimetype
      )
      imageUrl = uploadResult.url
    }

    const slide = await prisma.heroSlide.update({
      where: { id },
      data: {
        ...(imageUrl && { imageUrl }),
        ...(title !== undefined && { title: title || null }),
        ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder) || 0 }),
        ...(isActive !== undefined && { isActive: isActive === true || isActive === 'true' })
      }
    })
    res.json({ success: true, data: slide })
  })
]

// DELETE /api/hero-slides/:id
export const deleteHeroSlide = asyncHandler(async (req, res) => {
  const { id } = req.params
  const slide = await prisma.heroSlide.findUnique({ where: { id } })
  if (!slide) {
    return res.status(404).json({ success: false, message: 'Hero slide not found' })
  }
  const fileName = slide.imageUrl?.split('/').pop()
  if (fileName) {
    try {
      await deleteFile(getBucketConfig('heroSlides'), fileName)
    } catch (e) {
      console.warn('Could not delete hero slide image from storage:', e.message)
    }
  }
  await prisma.heroSlide.delete({ where: { id } })
  res.json({ success: true, message: 'Hero slide deleted' })
})
