import express from 'express'
import {
  getCareerApplications,
  createCareerApplication,
  getCareerApplicationById
} from '../controllers/careerApplicationController.js'

const router = express.Router()

router.get('/', getCareerApplications)
router.get('/:id', getCareerApplicationById)
router.post('/', createCareerApplication)

export default router
