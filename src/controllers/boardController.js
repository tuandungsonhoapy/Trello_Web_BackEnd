import { StatusCodes } from 'http-status-codes'

const createBoard = async (req, res, next) => {
  try {
    console.log('req.body: ', req.body)

    res.status(StatusCodes.CREATED).json({
      message: 'Create a new board successfully'
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message })
  }
}

export const boardController = {
  createBoard
}
