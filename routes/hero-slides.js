import express from 'express'
import {
  getHeroSlides,
  getHeroSlideById,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide
} from '../controllers/heroSlideController.js'

const router = express.Router()

router.get('/', getHeroSlides)
router.get('/:id', getHeroSlideById)
router.post('/', createHeroSlide)
router.put('/:id', updateHeroSlide)
router.delete('/:id', deleteHeroSlide)

export default router
