import express from 'express'
import {
  getTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getPublicTeamMembers
} from '../controllers/teamController.js'

const router = express.Router()

router.get('/', getTeamMembers)
router.get('/public', getPublicTeamMembers)
router.get('/:id', getTeamMemberById)
router.post('/', createTeamMember)
router.put('/:id', updateTeamMember)
router.delete('/:id', deleteTeamMember)

export default router
