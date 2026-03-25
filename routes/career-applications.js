import express from 'express'
import {
  getCareerApplications,
  createCareerApplication,
  getCareerApplicationById,
  deleteCareerApplication
} from '../controllers/careerApplicationController.js'

const router = express.Router()

router.get('/', getCareerApplications)
router.get('/:id', getCareerApplicationById)
router.post('/', createCareerApplication)
router.delete('/:id', deleteCareerApplication)

export default router
