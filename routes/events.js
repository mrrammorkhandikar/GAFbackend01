import express from 'express'
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getPublicEvents
} from '../controllers/eventController.js'

const router = express.Router()

router.get('/', getEvents)
router.get('/public', getPublicEvents)
router.get('/:id', getEventById)
router.post('/', createEvent)
router.put('/:id', updateEvent)
router.delete('/:id', deleteEvent)

export default router
