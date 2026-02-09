import express from 'express'
import {
  getDonations,
  createDonation,
  updateDonationStatus
} from '../controllers/donationController.js'

const router = express.Router()

router.get('/', getDonations)
router.post('/', createDonation)
router.patch('/:id/status', updateDonationStatus)

export default router
