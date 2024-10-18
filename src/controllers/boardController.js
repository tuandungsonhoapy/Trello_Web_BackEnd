import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

const createBoard = async (req, res, next) => {
  try {
    res.status(StatusCodes.CREATED).json({
      message: 'Create a new board successfully'
    })
  } catch (error) {
    next(error)
  }
}

export const boardController = {
  createBoard
}
