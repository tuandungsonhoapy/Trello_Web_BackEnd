import { StatusCodes } from 'http-status-codes'
import { boardService } from '~/services/boardService'

const createBoard = async (req, res, next) => {
  try {
    const result = await boardService.createBoard(req.jwtDecoded._id, req.body)

    res.status(StatusCodes.CREATED).json(result)
  } catch (error) {
    next(error)
  }
}

const getDetails = async (req, res, next) => {
  try {
    const { id } = req.params

    const result = await boardService.getDetails(req.jwtDecoded._id, id)

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

const getBoards = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id

    const { page, limit, q } = req.query

    const result = await boardService.getBoards(userId, page, limit, q)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const removeUserFromBoard = async (req, res, next) => {
  try {
    const { userId: userIdToRemove, boardId } = req.body
    const userId = req.jwtDecoded._id

    const result = await boardService.removeUserFromBoard(
      userId,
      userIdToRemove,
      boardId
    )

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

export const boardController = {
  createBoard,
  getDetails,
  updateBoard,
  moveCardToAnotherColumn,
  getBoards,
  removeUserFromBoard
}
