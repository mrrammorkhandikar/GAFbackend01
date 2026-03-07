import express from 'express'
import {
  getPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  deletePartner,
  getPublicPartners,
  getPublicPartnerBySlug,
} from '../controllers/partnerController.js'

const router = express.Router()

// Admin / internal routes
router.get('/', getPartners)
router.get('/:id', getPartnerById)
router.post('/', createPartner)
router.put('/:id', updatePartner)
router.delete('/:id', deletePartner)

// Public routes
router.get('/public/list/all', getPublicPartners)
router.get('/public/:slug', getPublicPartnerBySlug)

export default router

