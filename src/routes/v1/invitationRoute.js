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

router
  .route('/board/:invitationId')
  .put(authMiddleware.isAuthorized, invitationController.updateBoardInvitation)

export const invitationRoute = router
