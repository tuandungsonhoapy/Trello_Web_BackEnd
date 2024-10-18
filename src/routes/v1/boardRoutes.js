import express from 'express'
import { StatusCodes } from 'http-status-codes'

const router = express.Router()

router
  .route('/')
  .get((req, res) => {
    res.status(StatusCodes.OK).json({
      message: 'Get boards successfully'
    })
  })
  .post((req, res) => {
    res.status(StatusCodes.CREATED).json({
      message: 'Create a new board successfully'
    })
  })

export const boardRoutes = router
