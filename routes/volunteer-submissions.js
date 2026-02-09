import express from 'express'
import {
  getVolunteerSubmissions,
  createVolunteerSubmission,
  getVolunteerSubmissionById,
  getPublicVolunteerSubmissions
} from '../controllers/volunteerSubmissionController.js'

const router = express.Router()

router.get('/', getVolunteerSubmissions)
router.get('/public', getPublicVolunteerSubmissions)
router.get('/:id', getVolunteerSubmissionById)
router.post('/', createVolunteerSubmission)

export default router
