import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { getDB } from '~/config/mongodb'
import { BOARD_TYPES } from '~/utils/constants'
import { columnModel } from './columnModel'
import { cardModel } from './cardModel'
import { skipPageNumber } from '~/utils/algorithms'
import { userModel } from '~/models/userModel'

const BOARD_COLLECTION_NAME = 'boards'
const BOARD_COLLECTION_SCHEMA = Joi.object({
  title: Joi.string().required().min(3).max(100).trim().strict(),
  slug: Joi.string().required().min(3).trim().strict(),
  description: Joi.string().required().max(255).trim().strict(),
  type: Joi.string()
    .valid(...Object.values(BOARD_TYPES))
    .required(),
  columnOrderIds: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]),
  ownerIds: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]),
  memberIds: Joi.array()
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

const createBoard = async (userId, data) => {
  try {
    const validatedData = await validateData(data)

    return await getDB()
      .collection(BOARD_COLLECTION_NAME)
      .insertOne({
        ...validatedData,
        ownerIds: [ObjectId.createFromHexString(userId.toString())]
      })
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

const getDetails = async (userId, id) => {
  try {
    const queryConditions = [
      { _id: ObjectId.createFromHexString(id.toString()) },
      { _destroy: false },
      {
        $or: [
          {
            ownerIds: {
              $all: [ObjectId.createFromHexString(userId.toString())]
            }
          },
          {
            memberIds: {
              $all: [ObjectId.createFromHexString(userId.toString())]
            }
          }
        ]
      }
    ]

    return (
      (
        await getDB()
          .collection(BOARD_COLLECTION_NAME)
          .aggregate([
            {
              $match: { $and: queryConditions }
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
            },
            {
              $lookup: {
                from: userModel.USER_COLLECTION_NAME,
                localField: 'ownerIds',
                foreignField: '_id',
                as: 'owners',
                pipeline: [{ $project: { password: 0, verifyToken: 0 } }]
              }
            },
            {
              $lookup: {
                from: userModel.USER_COLLECTION_NAME,
                localField: 'memberIds',
                foreignField: '_id',
                as: 'members',
                pipeline: [{ $project: { password: 0, verifyToken: 0 } }]
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

const getBoards = async (userId, page, limit) => {
  try {
    const queryConditions = [
      { _destroy: false },
      {
        $or: [
          {
            ownerIds: {
              $all: [ObjectId.createFromHexString(userId.toString())]
            }
          },
          {
            memberIds: {
              $all: [ObjectId.createFromHexString(userId.toString())]
            }
          }
        ]
      }
    ]

    const response = (
      await getDB()
        .collection(BOARD_COLLECTION_NAME)
        .aggregate(
          [
            { $match: { $and: queryConditions } },
            { $sort: { title: 1 } },
            {
              $facet: {
                // * Thread 1: Query boards
                queryBoards: [
                  { $skip: skipPageNumber(page, limit) },
                  { $limit: limit }
                ],
                // * Thread 2: Query number of boards
                queryNumberBoards: [{ $count: 'numberBoards' }]
              }
            }
          ],
          { collation: { locale: 'en' } }
        )
        .toArray()
    )[0]

    return {
      boards: response.queryBoards || [],
      numberBoards: response.queryNumberBoards[0]?.numberBoards || 0
    }
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
  pullColumnOrderIds,
  getBoards
}
