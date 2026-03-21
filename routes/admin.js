import express from 'express'
import {
  adminLogin,
  getAdminProfile,
  getAllAdminStats,
  getAdminRecentActivity
} from '../controllers/adminController.js'

const router = express.Router()

router.post('/login', adminLogin)
router.get('/profile', getAdminProfile)
router.get('/stats', getAllAdminStats)
router.get('/activity', getAdminRecentActivity)

export default router
