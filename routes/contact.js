import express from 'express'
import {
  getContactForms,
  getContactFormById,
  createContactForm,
  updateContactStatus,
  getPublicContactMessages
} from '../controllers/contactController.js'

const router = express.Router()

router.get('/', getContactForms)
router.get('/public', getPublicContactMessages)
router.get('/:id', getContactFormById)
router.post('/', createContactForm)
router.put('/:id/status', updateContactStatus)

export default router
