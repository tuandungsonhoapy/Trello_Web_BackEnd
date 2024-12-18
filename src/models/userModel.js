import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { EMAIL_RULE, EMAIL_RULE_MESSAGE } from '~/utils/validators'
import { getDB } from '~/config/mongodb'
import { USER_ROLES } from '~/utils/constants'
import { skipPageNumber } from '~/utils/algorithms'

const USER_COLLECTION_NAME = 'users'
const USER_COLLECTION_SCHEMA = Joi.object({
  email: Joi.string()
    .required()
    .pattern(EMAIL_RULE)
    .message(EMAIL_RULE_MESSAGE),
  password: Joi.string().required(),
  username: Joi.string().required().trim().strict(),
  displayName: Joi.string().required().trim().strict(),
  avatar: Joi.string().default(null),
  role: Joi.string()
    .valid(USER_ROLES.ADMIN, USER_ROLES.CLIENT)
    .default(USER_ROLES.CLIENT),

  isActive: Joi.boolean().default(false),
  verifyToken: Joi.string(),
  require_2fa: Joi.boolean().default(false),
  secretKey_2fa: Joi.string(),

  createdAt: Joi.date().timestamp('javascript').default(Date.now()),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_FIELDS = ['_id', 'email', 'username', 'createdAt']

const validateData = async (data) => {
  return await USER_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false
  })
}

const createUser = async (data) => {
  try {
    const validatedData = await validateData(data)

    return await getDB()
      .collection(USER_COLLECTION_NAME)
      .insertOne(validatedData)
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (id) => {
  try {
    return await getDB()
      .collection(USER_COLLECTION_NAME)
      .findOne({ _id: ObjectId.createFromHexString(id.toString()) })
  } catch (error) {
    throw new Error(error)
  }
}

const updateUser = async (id, data) => {
  try {
    const updateData = { ...data }
    INVALID_UPDATE_FIELDS.forEach((field) => delete updateData[field])

    return await getDB()
      .collection(USER_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: ObjectId.createFromHexString(id.toString()) },
        {
          $set: {
            ...updateData,
            updatedAt: Date.now()
          }
        },
        { returnDocument: 'after' }
      )
  } catch (error) {
    throw new Error(error)
  }
}

const findOneByEmail = async (email) => {
  try {
    return await getDB().collection(USER_COLLECTION_NAME).findOne({ email })
  } catch (error) {
    throw new Error(error)
  }
}

const findAllUsers = async (page, limit, queryFilters) => {
  try {
    const skip = skipPageNumber(page, limit)
    const queryConditions = [{ _destroy: false }]
    if (queryFilters) {
      Object.keys(queryFilters).forEach((key) => {
        if (queryFilters[key]) {
          queryConditions.push({
            [key]: {
              $regex: new RegExp(queryFilters[key], 'i')
            }
          })
        }
      })
    }

    const result = await getDB()
      .collection(USER_COLLECTION_NAME)
      .aggregate([
        { $match: { $and: queryConditions } },
        {
          $facet: {
            // Query paginated users
            queryUsers: !queryFilters
              ? [{ $skip: skip }, { $limit: limit }]
              : [],
            // Query total count of users
            queryNumberUsers: [{ $count: 'numberUsers' }]
          }
        }
      ])
      .toArray()

    if (result.length > 0) {
      // Extract data from the facet result
      const users = result[0].queryUsers || []
      const total = result[0].queryNumberUsers?.[0]?.numberUsers || 0
      return { users, total }
    }

    return { users: [], total: 0 } // Default empty response
  } catch (error) {
    throw new Error(`Failed to fetch users: ${error.message}`)
  }
}

export const userModel = {
  USER_COLLECTION_NAME,
  USER_COLLECTION_SCHEMA,
  createUser,
  findOneById,
  updateUser,
  findOneByEmail,
  findAllUsers
}
