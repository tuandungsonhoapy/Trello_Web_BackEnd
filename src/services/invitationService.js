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

const updateBoardInvitation = async (userId, invitationId, data) => {
  const invitation = await invitationModel.findOneById(invitationId)

  if (!invitation) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Invitation not found!')
  }

  if (invitation.inviteeId.toString() !== userId) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Forbidden!')
  }

  const board = await boardModel.findOneById(invitation.boardInvitation.boardId)

  if (!board) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')
  }

  if (data.status === BOARD_INVITATION_STATUS.ACCEPTED) {
    const isExistedUser =
      board.ownerIds.includes(userId) || board.memberIds.includes(userId)

    if (isExistedUser) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'User already in board!')
    }
  }

  // update status of invitation
  const updatedInvitation = await invitationModel.update(invitationId, {
    boardInvitation: {
      ...invitation.boardInvitation,
      ...data
    },
    updatedAt: Date.now()
  })

  // Add user to board if invitation is accepted
  if (
    updatedInvitation.boardInvitation.status ===
    BOARD_INVITATION_STATUS.ACCEPTED
  ) {
    await boardModel.pushMemberIds(board._id, userId)
  }

  return updatedInvitation
}

export const invitationService = {
  inviteToBoard,
  getInvitations,
  updateBoardInvitation
}
