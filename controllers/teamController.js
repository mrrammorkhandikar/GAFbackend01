import prisma from '../lib/prisma.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { uploadImage, generateFileName } from '../middleware/upload.js'
import { uploadFile, deleteFile } from '../config/supabase.js'
import { body, param } from 'express-validator'
import { validateRequest } from '../middleware/errorHandler.js'
import { getBucketConfig } from '../config/storage.js'

// Validation rules for team member
const teamMemberValidationRules = [
  body('name').notEmpty().withMessage('Name is required'),
  body('position').notEmpty().withMessage('Position is required')
]

// GET /api/team - Get all team members
export const getTeamMembers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, active } = req.query
  
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const skip = (pageNum - 1) * limitNum
  
  const where = {}
  if (active !== undefined) {
    where.isActive = active === 'true'
  }
  
  const [teamMembers, total] = await Promise.all([
    prisma.teamMember.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.teamMember.count({ where })
  ])
  
  res.json({
    success: true,
    data: teamMembers,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum
    }
  })
})

// GET /api/team/:id - Get team member by ID
export const getTeamMemberById = asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const teamMember = await prisma.teamMember.findUnique({
    where: { id }
  })
  
  if (!teamMember) {
    return res.status(404).json({
      success: false,
      message: 'Team member not found'
    })
  }
  
  res.json({
    success: true,
    data: teamMember
  })
})

// POST /api/team - Create new team member
export const createTeamMember = [
  uploadImage.single('image'),
  ...teamMemberValidationRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { name, position, bio, email, linkedinUrl, twitterUrl, isActive = true } = req.body
    
    let imageUrl = null
    if (req.file) {
      try {
        const fileName = generateFileName(req.file.originalname, 'team-')
        const bucketName = getBucketConfig('team')
        
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
    
    const teamMember = await prisma.teamMember.create({
      data: {
        name,
        position,
        bio: bio || null,
        imageUrl,
        email: email || null,
        linkedinUrl: linkedinUrl || null,
        twitterUrl: twitterUrl || null,
        isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true
      }
    })
    
    res.status(201).json({
      success: true,
      message: 'Team member created successfully',
      data: teamMember
    })
  })
]

// PUT /api/team/:id - Update team member
export const updateTeamMember = [
  uploadImage.single('image'),
  param('id').isUUID().withMessage('Valid team member ID is required'),
  ...teamMemberValidationRules,
  validateRequest,
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const { name, position, bio, email, linkedinUrl, twitterUrl, isActive } = req.body
    
    const existingTeamMember = await prisma.teamMember.findUnique({
      where: { id }
    })
    
    if (!existingTeamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      })
    }
    
    let imageUrl = existingTeamMember.imageUrl
    if (req.file) {
      try {
        // Delete old image if exists
        if (existingTeamMember.imageUrl) {
          const oldFileName = existingTeamMember.imageUrl.split('/').pop()
          await deleteFile(getBucketConfig('team'), oldFileName)
        }
        
        const fileName = generateFileName(req.file.originalname, 'team-')
        const bucketName = getBucketConfig('team')
        
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
    
    const teamMember = await prisma.teamMember.update({
      where: { id },
      data: {
        name,
        position,
        bio: bio || null,
        imageUrl,
        email: email || null,
        linkedinUrl: linkedinUrl || null,
        twitterUrl: twitterUrl || null,
        isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : existingTeamMember.isActive
      }
    })
    
    res.json({
      success: true,
      message: 'Team member updated successfully',
      data: teamMember
    })
  })
]

// DELETE /api/team/:id - Delete team member
export const deleteTeamMember = asyncHandler(async (req, res) => {
  const { id } = req.params
  
  const teamMember = await prisma.teamMember.findUnique({
    where: { id }
  })
  
  if (!teamMember) {
    return res.status(404).json({
      success: false,
      message: 'Team member not found'
    })
  }
  
  // Delete image from storage if exists
  if (teamMember.imageUrl) {
    try {
      const fileName = teamMember.imageUrl.split('/').pop()
      await deleteFile(getBucketConfig('team'), fileName)
    } catch (error) {
      console.error('Error deleting image:', error)
    }
  }
  
  await prisma.teamMember.delete({
    where: { id }
  })
  
  res.json({
    success: true,
    message: 'Team member deleted successfully'
  })
})

// GET /api/team/public - Get public team members (simplified method for frontend)
export const getPublicTeamMembers = asyncHandler(async (req, res) => {
  try {
    const teamMembers = await prisma.teamMember.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: teamMembers
    });
  } catch (error) {
    console.error('Error fetching public team members:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team members',
      error: error.message
    });
  }
})
