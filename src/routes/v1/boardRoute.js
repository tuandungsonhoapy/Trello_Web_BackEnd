import express from 'express'
import { boardValidation } from '~/validations/boardValidation'
import { boardController } from '~/controllers/boardController'
import { authMiddleware } from '~/middlewares/authMiddleware'

const router = express.Router()

router
  .route('/')
  .get(authMiddleware.isAuthorized, boardController.getBoards)
  .post(
    authMiddleware.isAuthorized,
    boardValidation.createBoard,
    boardController.createBoard
  )

router
  .route('/move-card')
  .put(
    authMiddleware.isAuthorized,
    boardValidation.moveCardToAnotherColumn,
    boardController.moveCardToAnotherColumn
  )

router
  .route('/remove-user')
  .put(
    authMiddleware.isAuthorized,
    boardValidation.removeUserFromBoard,
    boardController.removeUserFromBoard
  )

router
  .route('/:id')
  .get(authMiddleware.isAuthorized, boardController.getDetails)
  .put(
    authMiddleware.isAuthorized,
    boardValidation.updateBoard,
    boardController.updateBoard
  )

export const boardRoute = router
