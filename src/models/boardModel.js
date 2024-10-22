import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { getDB } from '~/config/mongodb'
import { BOARD_TYPES } from '~/utils/constants'
import { columnModel } from './columnModel'
import { cardModel } from './cardModel'

const BOARD_COLLECTION_NAME = 'boards'
const BOARD_COLLECTION_SCHEMA = Joi.object({
  title: Joi.string().required().min(3).max(100).trim().strict(),
  slug: Joi.string().required().min(3).trim().strict(),
  description: Joi.string().required().max(255).trim().strict(),
  type: Joi.string().valid(BOARD_TYPES.PUBLIC, BOARD_TYPES.PRIVATE).required(),
  columnOrderIds: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]),
  createdAt: Joi.date().timestamp('javascript').default(Date.now()),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']

const validateData = async (data) => {
  return await BOARD_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false
  })
}

const createBoard = async (data) => {
  try {
    const validatedData = await validateData(data)

    return await getDB()
      .collection(BOARD_COLLECTION_NAME)
      .insertOne(validatedData)
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (id) => {
  try {
    return await getDB()
      .collection(BOARD_COLLECTION_NAME)
      .findOne({ _id: ObjectId.createFromHexString(id.toString()) })
  } catch (error) {
    throw new Error(error)
  }
}

const getDetails = async (id) => {
  try {
    return (
      (
        await getDB()
          .collection(BOARD_COLLECTION_NAME)
          .aggregate([
            {
              $match: {
                _id: ObjectId.createFromHexString(id.toString()),
                _destroy: false
              }
            },
            {
              $lookup: {
                from: columnModel.COLUMN_COLLECTION_NAME,
                localField: '_id',
                foreignField: 'boardId',
                as: 'columns'
              }
            },
            {
              $lookup: {
                from: cardModel.CARD_COLLECTION_NAME,
                localField: '_id',
                foreignField: 'boardId',
                as: 'cards'
              }
            }
          ])
          .toArray()
      )[0] || null
    )
  } catch (error) {
    throw new Error(error)
  }
}

const pushColumnOrderIds = async (column) => {
  try {
    return await getDB()
      .collection(BOARD_COLLECTION_NAME)
      .updateOne(
        { _id: ObjectId.createFromHexString(column.boardId.toString()) },
        {
          $push: {
            columnOrderIds: ObjectId.createFromHexString(column._id.toString())
          }
        }
      )
  } catch (error) {
    throw new Error(error)
  }
}

const updateBoard = async (id, data) => {
  try {
    INVALID_UPDATE_FIELDS.forEach((field) => {
      delete data[field]
    })

    if (data.columnOrderIds) {
      data.columnOrderIds = data.columnOrderIds.map((id) =>
        ObjectId.createFromHexString(id.toString())
      )
    }

    return await getDB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: ObjectId.createFromHexString(id.toString()) },
        {
          $set: {
            ...data,
            updatedAt: Date.now()
          }
        },
        { returnDocument: 'after' }
      )
  } catch (error) {
    throw new Error(error)
  }
}

const pullColumnOrderIds = async (column) => {
  try {
    return await getDB()
      .collection(BOARD_COLLECTION_NAME)
      .updateOne(
        { _id: ObjectId.createFromHexString(column.boardId.toString()) },
        {
          $pull: {
            columnOrderIds: ObjectId.createFromHexString(column._id.toString())
          }
        }
      )
  } catch (error) {
    throw new Error(error)
  }
}

export const boardModel = {
  BOARD_COLLECTION_NAME,
  BOARD_COLLECTION_SCHEMA,
  createBoard,
  findOneById,
  getDetails,
  pushColumnOrderIds,
  updateBoard,
  pullColumnOrderIds
}
