import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardValidation } from '~/validations/boardValidation'
import { boardController } from '~/controllers/boardController'

const router = express.Router()

router
  .route('/')
  .get((req, res) => {
    res.status(StatusCodes.OK).json({
      message: 'Get boards successfully'
    })
  })
  .post(boardValidation.createBoard, boardController.createBoard)

router
  .route('/move-card')
  .put(
    boardValidation.moveCardToAnotherColumn,
    boardController.moveCardToAnotherColumn
  )

router
  .route('/:id')
  .get(boardController.getDetails)
  .put(boardValidation.updateBoard, boardController.updateBoard)

export const boardRoute = router
