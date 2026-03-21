import express from 'express'
import {
  getEventRegistrations,
  getEventRegistrationById,
  createEventRegistration,
  deleteEventRegistration,
  submitPublicEventRegistration,
  updateEventRegistrationStatus
} from '../controllers/eventRegistrationController.js'

const router = express.Router()

router.post('/submit', submitPublicEventRegistration)
router.patch('/:id/status', updateEventRegistrationStatus)
router.get('/', getEventRegistrations)
router.get('/:id', getEventRegistrationById)
router.post('/', createEventRegistration)
router.delete('/:id', deleteEventRegistration)

export default router
