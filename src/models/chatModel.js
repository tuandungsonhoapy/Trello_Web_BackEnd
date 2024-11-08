import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { getDB } from '~/config/mongodb'
import {
  EMAIL_RULE,
  EMAIL_RULE_MESSAGE,
  OBJECT_ID_RULE,
  OBJECT_ID_RULE_MESSAGE
} from '~/utils/validators'

const CHAT_COLLECTION_NAME = 'chats'
const CHAT_COLLECTION_SCHEMA = Joi.object({
  memberIds: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]),
  messages: Joi.array()
    .items(
      Joi.object({
        userId: Joi.string()
          .pattern(OBJECT_ID_RULE)
          .message(OBJECT_ID_RULE_MESSAGE),
        userEmail: Joi.string().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
        userAvatar: Joi.string().trim().strict(),
        userDisplayName: Joi.string().trim().strict(),
        content: Joi.string(),
        messagedAt: Joi.date().timestamp()
      })
    )
    .default([]),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  _destroy: Joi.boolean().default(false)
})

//const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']

const validateData = async (data) => {
  return await CHAT_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false
  })
}

const createChat = async (data) => {
  try {
    const validatedData = await validateData(data)
    if (validatedData.memberIds) {
      validatedData.memberIds = validatedData.memberIds.map((id) =>
        ObjectId.createFromHexString(id.toString())
      )
    } else {
      throw new Error('MemberIds must have at least 2 members')
    }
    if (validatedData.memberIds.length < 2) {
      throw new Error('MemberIds must have at least 2 members')
    }
    const result = await getDB()
      .collection(CHAT_COLLECTION_NAME)
      .insertOne(validatedData)
    return result.ops[0]
  } catch (error) {
    throw new Error(error)
  }
}

export const chatModel = {
  CHAT_COLLECTION_NAME,
  CHAT_COLLECTION_SCHEMA,
  createChat
}
