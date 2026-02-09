import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../middleware/errorHandler.js'
import { uploadDocument, generateFileName } from '../middleware/upload.js'
import { uploadFile } from '../config/supabase.js'
import { body } from 'express-validator'
import { validateRequest } from '../middleware/errorHandler.js'
import { getBucketConfig } from '../config/storage.js'

const prisma = new PrismaClient()

const donationValidationRules = [
  body('donorName').notEmpty().withMessage('Donor name is required'),
  body('donorEmail').isEmail().withMessage('Valid email is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters')
]

export const getDonations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query
  
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const skip = (pageNum - 1) * limitNum
  
  const where = {}
  if (status) {
    where.status = status
  }
  
  const [donations, total] = await Promise.all([
    prisma.donation.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.donation.count({ where })
  ])
  
  // Hide donor info for anonymous donations in response
  const sanitizedDonations = donations.map(donation => ({
    ...donation,
    donorName: donation.isAnonymous ? 'Anonymous' : donation.donorName,
    donorEmail: donation.isAnonymous ? null : donation.donorEmail
  }))
  
  res.json({
    success: true,
    data: sanitizedDonations,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum
    }
  })
})

export const createDonation = [
  uploadDocument.single('receipt'),
  ...donationValidationRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { donorName, donorEmail, amount, currency = 'USD', message, isAnonymous = false } = req.body
    
    let receiptUrl = null
    if (req.file) {
      try {
        const fileName = generateFileName(req.file.originalname, 'donation-')
        const bucketName = getBucketConfig('donations')
        
        const uploadResult = await uploadFile(
          bucketName,
          fileName,
          req.file.buffer,
          req.file.mimetype
        )
        receiptUrl = uploadResult.url
      } catch (error) {
        console.error('Error uploading receipt:', error)
        // Continue without receipt if upload fails
      }
    }
    
    const donation = await prisma.donation.create({
      data: {
        donorName,
        donorEmail,
        amount: parseFloat(amount),
        currency,
        message: message || null,
        receiptUrl,
        isAnonymous: Boolean(isAnonymous),
        status: 'completed' // In real app, this would depend on payment processing
      }
    })
    
    // Remove sensitive info from response if anonymous
    const responseData = {
      ...donation,
      donorName: donation.isAnonymous ? 'Anonymous' : donation.donorName,
      donorEmail: donation.isAnonymous ? null : donation.donorEmail
    }
    
    res.status(201).json({
      success: true,
      message: 'Donation recorded successfully',
      data: responseData
    })
  })
]

export const updateDonationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { status } = req.body
  
  const donation = await prisma.donation.findUnique({
    where: { id }
  })
  
  if (!donation) {
    return res.status(404).json({
      success: false,
      message: 'Donation not found'
    })
  }
  
  const updatedDonation = await prisma.donation.update({
    where: { id },
    data: { status }
  })
  
  res.json({
    success: true,
    message: 'Donation status updated successfully',
    data: updatedDonation
  })
})
