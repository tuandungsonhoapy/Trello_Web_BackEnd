import { cardModel } from '~/models/cardModel'
import { columnModel } from '~/models/columnModel'

const createCard = async (data) => {
  const result = await cardModel.createCard(data)

  const response = await cardModel.findOneById(result.insertedId)

  if (response) await columnModel.pushCardOrderIds(response)

  return response
}

export const cardService = {
  createCard
}
