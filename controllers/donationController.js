import prisma from '../lib/prisma.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { uploadDocument, generateFileName } from '../middleware/upload.js'
import { uploadFile } from '../config/supabase.js'
import { body } from 'express-validator'
import { validateRequest } from '../middleware/errorHandler.js'
import { getBucketConfig } from '../config/storage.js'
import { sendDonationConfirmation, sendDonationAdminAlert } from '../config/email.js'

const donationValidationRules = [
  body('donorName').notEmpty().withMessage('Donor name is required'),
  body('donorEmail').isEmail().withMessage('Valid email is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters')
]

const publicSubmitRules = [
  body('donorName').trim().notEmpty().withMessage('Donor name is required'),
  body('donorEmail').isEmail().withMessage('Valid email is required'),
  body('amount')
    .custom((value) => {
      const n = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''))
      return !Number.isNaN(n) && n >= 0.01
    })
    .withMessage('Valid amount is required'),
  body('campaignId').trim().notEmpty().withMessage('Campaign is required'),
  body('currency').optional().isLength({ min: 3, max: 3 }),
  // JSON null is "present" — allow null for optional strings
  body('donorPhone').optional({ nullable: true }).isString(),
  body('donorAddress').optional({ nullable: true }).isString(),
  body('message').optional({ nullable: true }).isString(),
  body('isAnonymous').optional().isBoolean().toBoolean()
]

export const getDonations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10))
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
      orderBy: { createdAt: 'desc' },
      include: {
        campaign: {
          select: { id: true, title: true, slug: true }
        }
      }
    }),
    prisma.donation.count({ where })
  ])

  const sanitizedDonations = donations.map((donation) => ({
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

/** Public JSON submit — pending until admin approves */
export const submitPublicDonation = [
  ...publicSubmitRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    const {
      donorName,
      donorEmail,
      amount,
      currency = 'INR',
      campaignId,
      message,
      donorPhone,
      donorAddress,
      isAnonymous = false
    } = req.body

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, isActive: true }
    })

    if (!campaign) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive campaign'
      })
    }

    const donation = await prisma.donation.create({
      data: {
        donorName,
        donorEmail,
        donorPhone: donorPhone || null,
        donorAddress: donorAddress || null,
        amount: parseFloat(amount),
        currency,
        message: message || null,
        isAnonymous: Boolean(isAnonymous),
        status: 'pending',
        campaignId
      },
      include: {
        campaign: { select: { id: true, title: true, slug: true } }
      }
    })

    const responseData = {
      ...donation,
      donorName: donation.isAnonymous ? 'Anonymous' : donation.donorName,
      donorEmail: donation.isAnonymous ? null : donation.donorEmail
    }

    sendDonationAdminAlert(donorName, donorEmail, amount, currency).catch(console.error)

    res.status(201).json({
      success: true,
      message:
        'Donation request submitted. Our team will verify your payment and you will receive a confirmation email once approved.',
      data: responseData
    })
  })
]

export const createDonation = [
  uploadDocument.single('receipt'),
  ...donationValidationRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    const {
      donorName,
      donorEmail,
      amount,
      currency = 'INR',
      message,
      isAnonymous = false,
      campaignId
    } = req.body

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
      }
    }

    let validCampaignId = null
    if (campaignId) {
      const c = await prisma.campaign.findFirst({
        where: { id: campaignId, isActive: true }
      })
      if (c) validCampaignId = c.id
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
        status: 'pending',
        campaignId: validCampaignId
      }
    })

    const responseData = {
      ...donation,
      donorName: donation.isAnonymous ? 'Anonymous' : donation.donorName,
      donorEmail: donation.isAnonymous ? null : donation.donorEmail
    }

    sendDonationAdminAlert(donorName, donorEmail, amount, currency).catch(console.error)

    res.status(201).json({
      success: true,
      message: 'Donation recorded successfully (pending approval)',
      data: responseData
    })
  })
]

export const updateDonationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  const donation = await prisma.donation.findUnique({
    where: { id },
    include: { campaign: { select: { id: true, title: true, raisedAmount: true } } }
  })

  if (!donation) {
    return res.status(404).json({
      success: false,
      message: 'Donation not found'
    })
  }

  const wasCompleted = donation.status === 'completed'
  const becomingCompleted = status === 'completed' && !wasCompleted

  const updatedDonation = await prisma.$transaction(async (tx) => {
    const updated = await tx.donation.update({
      where: { id },
      data: { status },
      include: {
        campaign: { select: { id: true, title: true, slug: true } }
      }
    })

    if (becomingCompleted && donation.campaignId) {
      const campaign = await tx.campaign.findUnique({
        where: { id: donation.campaignId }
      })
      if (campaign) {
        const current = campaign.raisedAmount ?? 0
        await tx.campaign.update({
          where: { id: donation.campaignId },
          data: { raisedAmount: current + Math.round(donation.amount) }
        })
      }
    }

    return updated
  })

  if (becomingCompleted && !donation.isAnonymous && donation.donorEmail) {
    const campaignTitle = donation.campaign?.title || 'our programmes'
    sendDonationConfirmation(
      donation.donorEmail,
      donation.donorName,
      donation.amount,
      donation.currency,
      campaignTitle
    ).catch(console.error)
  }

  res.json({
    success: true,
    message: 'Donation status updated successfully',
    data: updatedDonation
  })
})
