import { StatusCodes } from 'http-status-codes'
import { columnService } from '~/services/columnService'

const createColumn = async (req, res, next) => {
  try {
    const result = await columnService.createColumn(req.body)

    res.status(StatusCodes.CREATED).json(result)
  } catch (error) {
    next(error)
  }
}

const updateColumn = async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await columnService.updateColumn(id, req.body)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

export const columnController = {
  createColumn,
  updateColumn
}
