import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { getDB } from '~/config/mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'

// Define Collection (name & schema)
const COLUMN_COLLECTION_NAME = 'columns'
const COLUMN_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  title: Joi.string().required().min(3).max(100).trim().strict(),

  // Lưu ý các item trong mảng cardOrderIds là ObjectId nên cần thêm pattern cho chuẩn nhé, (lúc quay video số 57 mình quên nhưng sang đầu video số 58 sẽ có nhắc lại về cái này.)
  cardOrderIds: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_FIELDS = ['_id', 'createdAt', 'boardId']

const validateData = async (data) => {
  return await COLUMN_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false
  })
}

const createColumn = async (data) => {
  try {
    const validatedData = await validateData(data)

    return await getDB()
      .collection(COLUMN_COLLECTION_NAME)
      .insertOne({
        ...validatedData,
        boardId: ObjectId.createFromHexString(data.boardId.toString())
      })
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (id) => {
  try {
    return await getDB()
      .collection(COLUMN_COLLECTION_NAME)
      .findOne({ _id: ObjectId.createFromHexString(id.toString()) })
  } catch (error) {
    throw new Error(error)
  }
}

const pushCardOrderIds = async (card) => {
  try {
    return await getDB()
      .collection(COLUMN_COLLECTION_NAME)
      .updateOne(
        { _id: ObjectId.createFromHexString(card.columnId.toString()) },
        {
          $push: {
            cardOrderIds: ObjectId.createFromHexString(card._id.toString())
          }
        }
      )
  } catch (error) {
    throw new Error(error)
  }
}

const updateColumn = async (id, data) => {
  try {
    INVALID_UPDATE_FIELDS.forEach((field) => {
      delete data[field]
    })

    if (data.cardOrderIds) {
      data.cardOrderIds = data.cardOrderIds.map((id) =>
        ObjectId.createFromHexString(id.toString())
      )
    }

    return await getDB()
      .collection(COLUMN_COLLECTION_NAME)
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

const deleteOneById = async (id) => {
  try {
    return await getDB()
      .collection(COLUMN_COLLECTION_NAME)
      .deleteOne({ _id: ObjectId.createFromHexString(id.toString()) })
  } catch (error) {
    throw new Error(error)
  }
}

const pullCardOrderIds = async (card) => {
  return await getDB()
    .collection(COLUMN_COLLECTION_NAME)
    .updateOne(
      { _id: ObjectId.createFromHexString(card.columnId.toString()) },
      {
        $pull: {
          cardOrderIds: ObjectId.createFromHexString(card._id.toString())
        }
      }
    )
}

export const columnModel = {
  COLUMN_COLLECTION_NAME,
  COLUMN_COLLECTION_SCHEMA,
  createColumn,
  findOneById,
  pushCardOrderIds,
  updateColumn,
  deleteOneById,
  pullCardOrderIds
}
