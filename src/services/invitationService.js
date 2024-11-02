import ApiError from '~/utils/ApiError'
import { userModel } from '~/models/userModel'
import { boardModel } from '~/models/boardModel'
import { invitationModel } from '~/models/invitationModel'
import { pickUser } from '~/utils/formatters'
import { BOARD_INVITATION_STATUS, INVITATION_TYPES } from '~/utils/constants'
import { StatusCodes } from 'http-status-codes'

const inviteToBoard = async (data, inviterId) => {
  const inviter = await userModel.findOneById(inviterId)

  const invitee = await userModel.findOneByEmail(data.inviteeEmail)

  const board = await boardModel.findOneById(data.boardId)

  if (!invitee) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found!')
  }

  if (!inviter || !board) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Board or user not found!')
  }

  const newInvitationData = {
    inviterId,
    inviteeId: invitee._id.toString(),
    type: INVITATION_TYPES.BOARD_INVITATION,
    boardInvitation: {
      boardId: board._id.toString(),
      status: BOARD_INVITATION_STATUS.PENDING
    }
  }

  const createdInvitation = await invitationModel.inviteToBoard(
    newInvitationData
  )
  const invitation = await invitationModel.findOneById(
    createdInvitation.insertedId
  )

  return {
    ...invitation,
    board,
    inviter: pickUser(inviter),
    invitee: pickUser(invitee)
  }
}

const getInvitations = async (userId) => {
  const invitations = await invitationModel.findManyByUser(userId)

  return invitations.map((invitation) => ({
    ...invitation,
    board: invitation.board[0] || {},
    inviter: pickUser(invitation.inviter[0]) || {},
    invitee: pickUser(invitation.invitee[0]) || {}
  }))
}

export const invitationService = {
  inviteToBoard,
  getInvitations
}
