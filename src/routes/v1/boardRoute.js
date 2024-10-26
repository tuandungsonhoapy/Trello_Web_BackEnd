import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardValidation } from '~/validations/boardValidation'
import { boardController } from '~/controllers/boardController'
import { authMiddleware } from '~/middlewares/authMiddleware'

const router = express.Router()

router
  .route('/')
  .get(authMiddleware.isAuthorized, (req, res) => {
    res.status(StatusCodes.OK).json({
      message: 'Get boards successfully'
    })
  })
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
  .route('/:id')
  .get(authMiddleware.isAuthorized, boardController.getDetails)
  .put(
    authMiddleware.isAuthorized,
    boardValidation.updateBoard,
    boardController.updateBoard
  )

export const boardRoute = router
