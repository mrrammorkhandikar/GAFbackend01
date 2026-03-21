import prisma from '../lib/prisma.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { body } from 'express-validator'
import { validateRequest } from '../middleware/errorHandler.js'
import { sendContactConfirmation, sendContactAdminAlert } from '../config/email.js'

const contactValidationRules = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required')
]

export const getContactForms = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query
  
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const skip = (pageNum - 1) * limitNum
  
  const where = {}
  if (status) {
    where.status = status
  }
  
  const [contacts, total] = await Promise.all([
    prisma.contactForm.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.contactForm.count({ where })
  ])
  
  res.json({
    success: true,
    data: contacts,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum
    }
  })
})

export const getContactFormById = asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const contact = await prisma.contactForm.findUnique({
    where: { id }
  })
  
  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contact form submission not found'
    })
  }
  
  // Update status to 'read' when viewed
  if (contact.status === 'new') {
    await prisma.contactForm.update({
      where: { id },
      data: { status: 'read' }
    })
  }
  
  res.json({
    success: true,
    data: contact
  })
})

export const createContactForm = [
  ...contactValidationRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body
    
    const contact = await prisma.contactForm.create({
      data: {
        name,
        email,
        subject,
        message
      }
    })

    // Send emails (non-blocking — don't fail the request if email fails)
    sendContactConfirmation(email, name, subject).catch(console.error)
    sendContactAdminAlert(name, email, subject, message).catch(console.error)
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: contact
    })
  })
]

export const updateContactStatus = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { status } = req.body
  
  const contact = await prisma.contactForm.findUnique({
    where: { id }
  })
  
  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contact form submission not found'
    })
  }
  
  const updatedContact = await prisma.contactForm.update({
    where: { id },
    data: { status }
  })
  
  res.json({
    success: true,
    message: 'Contact status updated successfully',
    data: updatedContact
  })
})

export const deleteContactForm = asyncHandler(async (req, res) => {
  const { id } = req.params

  const contact = await prisma.contactForm.findUnique({
    where: { id }
  })

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contact form submission not found'
    })
  }

  await prisma.contactForm.delete({
    where: { id }
  })

  res.json({
    success: true,
    message: 'Contact submission deleted successfully'
  })
})

// GET /api/contact/public - Get public contact messages (simplified method for frontend)
export const getPublicContactMessages = asyncHandler(async (req, res) => {
  try {
    const contactMessages = await prisma.contactForm.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: contactMessages
    });
  } catch (error) {
    console.error('Error fetching public contact messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contact messages',
      error: error.message
    });
  }
})
