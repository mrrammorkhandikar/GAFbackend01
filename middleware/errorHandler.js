import { validationResult } from 'express-validator'

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack)

  // Prisma errors
  if (err.code?.startsWith('P')) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({
          success: false,
          message: 'Resource already exists',
          error: err.meta?.target ? `${err.meta.target.join(', ')} must be unique` : 'Duplicate entry'
        })
      case 'P2025':
        return res.status(404).json({
          success: false,
          message: 'Resource not found',
          error: err.message
        })
      default:
        return res.status(500).json({
          success: false,
          message: 'Database error occurred',
          error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        })
    }
  }

  // Supabase errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message || 'Storage service error',
      error: process.env.NODE_ENV === 'development' ? err : 'Service unavailable'
    })
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(err.errors).map(e => e.message)
    })
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
}

// 404 handler
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  })
}

// Validation result handler
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    })
  }
  next()
}

// Async wrapper to catch async errors
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}