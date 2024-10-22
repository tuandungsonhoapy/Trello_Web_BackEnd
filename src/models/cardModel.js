import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { getDB } from '~/config/mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'

// Define Collection (name & schema)
const CARD_COLLECTION_NAME = 'cards'
const CARD_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  columnId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),

  title: Joi.string().required().min(3).max(100).trim().strict(),
  description: Joi.string().optional(),
  cover: Joi.string().optional().trim().strict(),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_FIELDS = ['_id', 'createdAt', 'boardId']

const validateData = async (data) => {
  return await CARD_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false
  })
}

const createCard = async (data) => {
  try {
    const validatedData = await validateData(data)

    return await getDB()
      .collection(CARD_COLLECTION_NAME)
      .insertOne({
        ...validatedData,
        boardId: ObjectId.createFromHexString(data.boardId.toString()),
        columnId: ObjectId.createFromHexString(data.columnId.toString())
      })
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (id) => {
  try {
    return await getDB()
      .collection(CARD_COLLECTION_NAME)
      .findOne({ _id: ObjectId.createFromHexString(id.toString()) })
  } catch (error) {
    throw new Error(error)
  }
}

const updateCard = async (id, data) => {
  try {
    INVALID_UPDATE_FIELDS.forEach((field) => {
      delete data[field]
    })

    if (data.columnId) {
      data.columnId = ObjectId.createFromHexString(data.columnId.toString())
    }

    return await getDB()
      .collection(CARD_COLLECTION_NAME)
      .findOneAndUpdate(
        {
          _id: ObjectId.createFromHexString(id.toString())
        },
        {
          $set: {
            ...data,
            updatedAt: Date.now()
          }
        },
        {
          returnDocument: 'after'
        }
      )
  } catch (error) {
    throw new Error(error)
  }
}

const deleteManyByColumnId = async (columnId) => {
  try {
    return await getDB()
      .collection(CARD_COLLECTION_NAME)
      .deleteMany({
        columnId: ObjectId.createFromHexString(columnId.toString())
      })
  } catch (error) {
    throw new Error(error)
  }
}

const deleteOneById = async (id) => {
  try {
    return await getDB()
      .collection(CARD_COLLECTION_NAME)
      .deleteOne({ _id: ObjectId.createFromHexString(id.toString()) })
  } catch (error) {
    throw new Error(error)
  }
}

export const cardModel = {
  CARD_COLLECTION_NAME,
  CARD_COLLECTION_SCHEMA,
  createCard,
  findOneById,
  updateCard,
  deleteManyByColumnId,
  deleteOneById
}
