import express from 'express'
import {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getPublicCampaigns
} from '../controllers/campaignController.js'

const router = express.Router()

router.get('/', getCampaigns)
router.get('/public', getPublicCampaigns)
router.get('/:id', getCampaignById)
router.post('/', createCampaign)
router.put('/:id', updateCampaign)
router.delete('/:id', deleteCampaign)

export default router
