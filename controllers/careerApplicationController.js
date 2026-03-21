import prisma from '../lib/prisma.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { uploadDocument, generateFileName } from '../middleware/upload.js'
import { uploadFile } from '../config/supabase.js'
import { body, param } from 'express-validator'
import { validateRequest } from '../middleware/errorHandler.js'
import { getBucketConfig } from '../config/storage.js'
import { sendCareerApplicationConfirmation, sendCareerApplicationAdminAlert } from '../config/email.js'

const careerApplicationValidationRules = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('careerId').isUUID().withMessage('Valid career ID is required')
]

export const getCareerApplications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, careerId } = req.query
  
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const skip = (pageNum - 1) * limitNum
  
  const where = {}
  if (careerId) {
    where.careerId = careerId
  }
  
  const [applications, total] = await Promise.all([
    prisma.careerApplication.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        career: {
          select: {
            id: true,
            title: true,
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
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum
    }
  })
})

export const createCareerApplication = [
  uploadDocument.single('resume'),
  ...careerApplicationValidationRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { name, email, phone, careerId } = req.body
    
    // Check if career exists
    const career = await prisma.career.findUnique({
      where: { id: careerId }
    })
    
    if (!career) {
      return res.status(404).json({
        success: false,
        message: 'Career opportunity not found'
      })
    }
    
    let resumeUrl = null
    if (req.file) {
      try {
        const fileName = generateFileName(req.file.originalname, 'resume-')
        const bucketName = getBucketConfig('donations') // Using donations bucket for resumes
        
        const uploadResult = await uploadFile(
          bucketName,
          fileName,
          req.file.buffer,
          req.file.mimetype
        )
        resumeUrl = uploadResult.url
      } catch (error) {
        console.error('Error uploading resume:', error)
        // Continue without resume if upload fails
      }
    }
    
    const application = await prisma.careerApplication.create({
      data: {
        name,
        email,
        phone,
        careerId,
        resumeUrl
      }
    })

    // Send emails (non-blocking)
    sendCareerApplicationConfirmation(email, name, career.title).catch(console.error)
    sendCareerApplicationAdminAlert(name, email, phone, career.title).catch(console.error)
    
    res.status(201).json({
      success: true,
      message: 'Career application submitted successfully',
      data: application
    })
  })
]

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
