import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import prisma from './lib/prisma.js'

// Import routes
import campaignRoutes from './routes/campaigns.js'
import eventRoutes from './routes/events.js'
import teamRoutes from './routes/team.js'
import donationRoutes from './routes/donations.js'
import contactRoutes from './routes/contact.js'
import volunteerOpportunityRoutes from './routes/volunteer-opportunities.js'
import volunteerSubmissionRoutes from './routes/volunteer-submissions.js'
import careerRoutes from './routes/careers.js'
import careerApplicationRoutes from './routes/career-applications.js'
import eventRegistrationRoutes from './routes/event-registrations.js'
import adminRoutes from './routes/admin.js'
import publicRoutes from './routes/public.js'
import partnerRoutes from './routes/partners.js'
import heroSlideRoutes from './routes/hero-slides.js'

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

// Import config
import { initializeStorageBuckets } from './config/storage.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())

// CORS configuration - Allow all origins for GET requests, restrict others
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    // Allow all origins for GET requests
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true)
    }
    
    // In production, allow specific origins
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://gaf-frontend.vercel.app',
      'https://gafbackend.vercel.app'
    ].filter(Boolean) // Remove undefined values
    
    // Allow Vercel preview deployments (dynamic subdomains)
    const isVercelPreview = origin.endsWith('.vercel.app')
    
    if (allowedOrigins.includes(origin) || isVercelPreview) {
      callback(null, true)
    } else {
      console.log('Blocked by CORS:', origin)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count']
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// API Routes
app.use('/api/campaigns', campaignRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/team', teamRoutes)
app.use('/api/donations', donationRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/volunteer-opportunities', volunteerOpportunityRoutes)
app.use('/api/volunteer-submissions', volunteerSubmissionRoutes)
app.use('/api/careers', careerRoutes)
app.use('/api/career-applications', careerApplicationRoutes)
app.use('/api/event-registrations', eventRegistrationRoutes)
app.use('/api/partners', partnerRoutes)
app.use('/api/hero-slides', heroSlideRoutes)
app.use('/api/admin', adminRoutes)

// Public routes - Unrestricted access to data
app.use('/api/public', publicRoutes)

// Error handling middleware (must be last)
app.use(notFoundHandler)
app.use(errorHandler)

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully')
  await prisma.$disconnect()
  process.exit(0)
})

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Initialize storage buckets
    await initializeStorageBuckets()
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`📅 ${new Date().toLocaleString()}`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Only start the server if running directly (not imported)
import { fileURLToPath } from 'url'
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer()
}

export default app