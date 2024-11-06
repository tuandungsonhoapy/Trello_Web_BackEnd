import { StatusCodes } from 'http-status-codes'
import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { getDB } from '~/config/mongodb'
import ApiError from '~/utils/ApiError'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'

const USER_SESSION_COLLECTION_NAME = 'user_sessions'
const USER_SESSION_COLLECTION_SCHEMA = Joi.object({
  userId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  userAgent: Joi.string().required(),
  is_2fa_verified: Joi.boolean().default(false),
  last_login: Joi.date().timestamp('javascript').default(Date.now()),
  updatedAt: Joi.date().timestamp('javascript').default(null)
})

const INVALID_UPDATE_FIELDS = ['_id', 'userId', 'userAgent']

const createUserSession = async (data) => {
  try {
    const validatedData = await USER_SESSION_COLLECTION_SCHEMA.validateAsync(
      data,
      {
        abortEarly: false
      }
    )

    if (validatedData.userId) {
      validatedData.userId = ObjectId.createFromHexString(
        validatedData.userId.toString()
      )
    } else {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'User ID is required!')
    }

    return await getDB()
      .collection(USER_SESSION_COLLECTION_NAME)
      .insertOne(validatedData)
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = (id) => {
  if (id) {
    id = ObjectId.createFromHexString(id.toString())
  } else {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'ID is required!')
  }

  try {
    return getDB().collection(USER_SESSION_COLLECTION_NAME).findOne({ _id: id })
  } catch (error) {
    throw new Error(error)
  }
}

const deleteByUserIdAndUserAgent = async (userId, userAgent) => {
  try {
    return await getDB()
      .collection(USER_SESSION_COLLECTION_NAME)
      .deleteMany({
        userId: ObjectId.createFromHexString(userId.toString()),
        userAgent
      })
  } catch (error) {
    throw new Error(error)
  }
}

const findByUserIdAndUserAgent = async (userId, userAgent) => {
  if (userId) {
    userId = ObjectId.createFromHexString(userId.toString())
  } else {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User ID is required!')
  }

  try {
    return await getDB()
      .collection(USER_SESSION_COLLECTION_NAME)
      .findOne({ userId, userAgent })
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (userId, userAgent, data) => {
  try {
    INVALID_UPDATE_FIELDS.forEach((field) => delete data[field])

    return await getDB()
      .collection(USER_SESSION_COLLECTION_NAME)
      .findOneAndUpdate(
        { userId: ObjectId.createFromHexString(userId.toString()), userAgent },
        { $set: data },
        { returnDocument: 'after' }
      )
  } catch (error) {
    throw new Error(error)
  }
}

export const userSessionsModel = {
  USER_SESSION_COLLECTION_NAME,
  USER_SESSION_COLLECTION_SCHEMA,
  createUserSession,
  findOneById,
  deleteByUserIdAndUserAgent,
  findByUserIdAndUserAgent,
  update
}
