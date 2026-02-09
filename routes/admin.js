import express from 'express'
import {
  adminLogin,
  getAdminProfile,
  getAllAdminStats
} from '../controllers/adminController.js'

const router = express.Router()

router.post('/login', adminLogin)
router.get('/profile', getAdminProfile)
router.get('/stats', getAllAdminStats)

export default router
