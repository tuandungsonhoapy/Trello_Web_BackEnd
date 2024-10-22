import { StatusCodes } from 'http-status-codes'
import { cardModel } from '~/models/cardModel'
import { columnModel } from '~/models/columnModel'
import ApiError from '~/utils/ApiError'

const createCard = async (data) => {
  const result = await cardModel.createCard(data)

  const response = await cardModel.findOneById(result.insertedId)

  if (response) await columnModel.pushCardOrderIds(response)

  return response
}

const updateCard = async (id, data) => {
  return await cardModel.updateCard(id, {
    ...data,
    updatedAt: Date.now()
  })
}

const deleteCard = async (id) => {
  // * Get card data
  const cardData = await cardModel.findOneById(id)

  if (!cardData) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Card not found!')
  }

  // * Delete card data
  await cardModel.deleteOneById(id)

  // * Delete card from column cardOrderIds
  await columnModel.pullCardOrderIds(cardData)

  return { deleted: true }
}

export const cardService = {
  createCard,
  updateCard,
  deleteCard
}
