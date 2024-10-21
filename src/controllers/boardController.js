import { StatusCodes } from 'http-status-codes'
import { boardService } from '~/services/boardService'

const createBoard = async (req, res, next) => {
  try {
    const result = await boardService.createBoard(req.body)

    res.status(StatusCodes.CREATED).json(result)
  } catch (error) {
    next(error)
  }
}

const getDetails = async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await boardService.getDetails(id)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const updateBoard = async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await boardService.updateBoard(id, req.body)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const moveCardToAnotherColumn = async (req, res, next) => {
  try {
    const result = await boardService.moveCardToAnotherColumn(req.body)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

export const boardController = {
  createBoard,
  getDetails,
  updateBoard,
  moveCardToAnotherColumn
}
