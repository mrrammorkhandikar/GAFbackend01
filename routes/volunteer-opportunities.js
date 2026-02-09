import express from 'express'
import {
  getVolunteerOpportunities,
  getVolunteerOpportunityById,
  createVolunteerOpportunity,
  updateVolunteerOpportunity,
  deleteVolunteerOpportunity,
  getPublicVolunteerOpportunities
} from '../controllers/volunteerOpportunityController.js'

const router = express.Router()

router.get('/', getVolunteerOpportunities)
router.get('/public', getPublicVolunteerOpportunities)
router.get('/:id', getVolunteerOpportunityById)
router.post('/', createVolunteerOpportunity)
router.put('/:id', updateVolunteerOpportunity)
router.delete('/:id', deleteVolunteerOpportunity)

export default router
