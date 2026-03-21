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

// Public routes must be registered before /:id so "public" is not captured as an id
router.get('/public/list/all', getPublicPartners)
router.get('/public/:slug', getPublicPartnerBySlug)

// Admin / internal
router.get('/', getPartners)
router.post('/', createPartner)
router.get('/:id', getPartnerById)
router.put('/:id', updatePartner)
router.delete('/:id', deletePartner)

export default router
