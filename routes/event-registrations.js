import express from 'express'
import {
  getEventRegistrations,
  getEventRegistrationById,
  createEventRegistration,
  deleteEventRegistration
} from '../controllers/eventRegistrationController.js'

const router = express.Router()

router.get('/', getEventRegistrations)
router.get('/:id', getEventRegistrationById)
router.post('/', createEventRegistration)
router.delete('/:id', deleteEventRegistration)

export default router