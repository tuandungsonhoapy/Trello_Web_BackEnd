import { columnModel } from '~/models/columnModel'
import { boardModel } from '~/models/boardModel'
import { cloneDeep } from 'lodash'

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

export const columnService = {
  createColumn,
  updateColumn
}
