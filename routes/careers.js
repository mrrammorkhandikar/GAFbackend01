import express from 'express'
import {
  getCareers,
  getCareerById,
  createCareer,
  updateCareer,
  deleteCareer,
  getPublicCareers
} from '../controllers/careerController.js'

const router = express.Router()

router.get('/', getCareers)
router.get('/public', getPublicCareers)
router.get('/:id', getCareerById)
router.post('/', createCareer)
router.put('/:id', updateCareer)
router.delete('/:id', deleteCareer)

export default router
