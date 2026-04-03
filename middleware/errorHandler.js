import { validationResult } from 'express-validator'
import { Prisma } from '@prisma/client'

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack)

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Invalid request data',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    })
  }

  // Prisma connector / driver errors (often no `P` code): pooler, TLS, "prepared statement does not exist"
  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    const msg = err.message || ''
    if (/prepared statement/i.test(msg)) {
      console.error(
        '[Prisma] Pooler incompatibility: add ?pgbouncer=true to DATABASE_URL (Supabase transaction pooler :6543).'
      )
    }
    return res.status(503).json({
      success: false,
      message: 'Database temporarily unavailable. Please retry.',
      error: process.env.NODE_ENV === 'development' ? msg : undefined
    })
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    console.error('[Prisma] Init error:', err.message)
    return res.status(503).json({
      success: false,
      message: 'Database connection failed.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    })
  }

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
      case 'P2022':
        return res.status(503).json({
          success: false,
          message:
            'Database schema is out of date (e.g. missing column). Run `npx prisma migrate deploy` on the server database, then restart the API.',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
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