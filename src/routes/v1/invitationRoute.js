import express from 'express'
import { invitationValidation } from '~/validations/invitationValidation'
import { invitationController } from '~/controllers/invitationController'
import { authMiddleware } from '~/middlewares/authMiddleware'

const router = express.Router()

router
  .route('/board')
  .post(
    authMiddleware.isAuthorized,
    invitationValidation.inviteToBoard,
    invitationController.inviteToBoard
  )

router
  .route('/')
  .get(authMiddleware.isAuthorized, invitationController.getInvitations)

export const invitationRoute = router
