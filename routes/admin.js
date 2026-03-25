import express from 'express'
import {
  adminLogin,
  getAdminProfile,
  getAllAdminStats,
  getAdminRecentActivity,
  adminForgotPassword,
  adminResetPassword
} from '../controllers/adminController.js'

const router = express.Router()

router.post('/login', adminLogin)
router.post('/forgot-password', adminForgotPassword)
router.post('/reset-password', adminResetPassword)
router.get('/profile', getAdminProfile)
router.get('/stats', getAllAdminStats)
router.get('/activity', getAdminRecentActivity)

export default router
