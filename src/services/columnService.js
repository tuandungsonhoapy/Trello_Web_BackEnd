import { columnModel } from '~/models/columnModel'
import { boardModel } from '~/models/boardModel'
import { cardModel } from '~/models/cardModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

const createColumn = async (data) => {
  const result = await columnModel.createColumn(data)

  const response = await columnModel.findOneById(result.insertedId)

  if (response) {
    response.cards = []

    await boardModel.pushColumnOrderIds(response)
  }

  return response
}

const updateColumn = async (id, data) => {
  return await columnModel.updateColumn(id, data)
}

const deleteColumn = async (id) => {
  const column = await columnModel.findOneById(id)

  if (!column) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Column not found!')
  }

  // * Delete column from board columnOrderIds
  await boardModel.pullColumnOrderIds(column)

  // * Delete column
  await columnModel.deleteOneById(id)

  // * Delete cards from column
  await cardModel.deleteManyByColumnId(id)

  return { deleted: true }
}

export const columnService = {
  createColumn,
  updateColumn,
  deleteColumn
}
