import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// File filter for images
const imageFileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return cb(new Error('Only image files are allowed!'), false)
  }
  cb(null, true)
}

// File filter for documents (donation receipts)
const documentFileFilter = (req, file, cb) => {
  // Accept PDFs and images
  if (!file.originalname.match(/\.(pdf|jpg|jpeg|png)$/i)) {
    return cb(new Error('Only PDF and image files are allowed!'), false)
  }
  cb(null, true)
}

// Storage configuration (we'll use memory storage since we upload to Supabase)
const storage = multer.memoryStorage()

// Multer upload configurations
export const uploadImage = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

export const uploadDocument = multer({
  storage: storage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
})

// Generate unique filename
export const generateFileName = (originalName, prefix = '') => {
  const ext = path.extname(originalName)
  return `${prefix}${uuidv4()}${ext}`
}