import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { getDB } from '~/config/mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { INVITATION_TYPES, BOARD_INVITATION_STATUS } from '~/utils/constants'
import { userModel } from '~/models/userModel'
import { boardModel } from '~/models/boardModel'

const INVITATION_COLLECTION_NAME = 'invitations'
const INVITATION_COLLECTION_SCHEMA = Joi.object({
  inviterId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  inviteeId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),
  type: Joi.string()
    .valid(...Object.values(INVITATION_TYPES))
    .required(),
  boardInvitation: Joi.object({
    boardId: Joi.string()
      .required()
      .pattern(OBJECT_ID_RULE)
      .message(OBJECT_ID_RULE_MESSAGE),
    status: Joi.string()
      .valid(...Object.values(BOARD_INVITATION_STATUS))
      .required()
  }).optional(),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_FIELDS = [
  '_id',
  'inviterId',
  'inviteeId',
  'type',
  'createdAt'
]

const validateData = async (data) => {
  return await INVITATION_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false
  })
}

const inviteToBoard = async (data) => {
  try {
    const validatedData = await validateData(data)

    const newInvitation = {
      ...validatedData,
      inviterId: ObjectId.createFromHexString(data.inviterId.toString()),
      inviteeId: ObjectId.createFromHexString(data.inviteeId.toString())
    }

    if (data.boardInvitation) {
      newInvitation.boardInvitation.boardId = ObjectId.createFromHexString(
        data.boardInvitation.boardId.toString()
      )
    }

    return await getDB()
      .collection(INVITATION_COLLECTION_NAME)
      .insertOne(newInvitation)
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (id) => {
  try {
    return await getDB()
      .collection(INVITATION_COLLECTION_NAME)
      .findOne({ _id: ObjectId.createFromHexString(id.toString()) })
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (id, data) => {
  try {
    INVALID_UPDATE_FIELDS.forEach((field) => {
      delete data[field]
    })

    if (data.boardInvitation) {
      data.boardInvitation.boardId = ObjectId.createFromHexString(
        data.boardInvitation.boardId.toString()
      )
    }

    return await getDB()
      .collection(INVITATION_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: ObjectId.createFromHexString(id.toString()) },
        { $set: { ...data, updatedAt: Date.now() } },
        { returnDocument: 'after' }
      )
  } catch (error) {
    throw new Error(error)
  }
}

const findManyByUser = async (userId) => {
  try {
    return await getDB()
      .collection(INVITATION_COLLECTION_NAME)
      .aggregate([
        {
          $match: {
            inviteeId: ObjectId.createFromHexString(userId.toString()),
            _destroy: false
          }
        },
        {
          $lookup: {
            from: userModel.USER_COLLECTION_NAME,
            localField: 'inviterId',
            foreignField: '_id',
            as: 'inviter',
            pipeline: [{ $project: { password: 0, verifyToken: 0 } }]
          }
        },
        {
          $lookup: {
            from: userModel.USER_COLLECTION_NAME,
            localField: 'inviteeId',
            foreignField: '_id',
            as: 'invitee',
            pipeline: [{ $project: { password: 0, verifyToken: 0 } }]
          }
        },
        {
          $lookup: {
            from: boardModel.BOARD_COLLECTION_NAME,
            localField: 'boardInvitation.boardId',
            foreignField: '_id',
            as: 'board'
          }
        }
      ])
      .toArray()
  } catch (error) {
    throw new Error(error)
  }
}

export const invitationModel = {
  INVITATION_COLLECTION_NAME,
  INVITATION_COLLECTION_SCHEMA,
  inviteToBoard,
  findOneById,
  update,
  findManyByUser
}
