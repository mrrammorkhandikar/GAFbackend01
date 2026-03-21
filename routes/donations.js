import express from 'express'
import {
  getDonations,
  createDonation,
  updateDonationStatus,
  submitPublicDonation
} from '../controllers/donationController.js'

const router = express.Router()

router.get('/', getDonations)
router.post('/submit', submitPublicDonation)
router.post('/', createDonation)
router.patch('/:id/status', updateDonationStatus)
router.put('/:id/status', updateDonationStatus)

export default router
