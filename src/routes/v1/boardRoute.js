import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardValidation } from '~/validations/boardValidation'

const router = express.Router()

router
  .route('/')
  .get((req, res) => {
    res.status(StatusCodes.OK).json({
      message: 'Get boards successfully'
    })
  })
  .post(boardValidation.createBoard)

export const boardRoute = router
