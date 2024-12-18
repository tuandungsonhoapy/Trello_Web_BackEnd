import { slugify } from '~/utils/formatters'
import { boardModel } from '~/models/boardModel'
import { cloneDeep } from 'lodash'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { columnModel } from '~/models/columnModel'
import { cardModel } from '~/models/cardModel'
import {
  CARD_MEMBER_ACTIONS,
  DEFAULT_LIMIT_PER_PAGE,
  DEFAULT_PAGE
} from '~/utils/constants'

const createBoard = async (userId, data) => {
  const newBoard = {
    ...data,
    slug: slugify(data.title)
  }

  const result = await boardModel.createBoard(userId, newBoard)

  return await boardModel.findOneById(result.insertedId)
}

const getDetails = async (userId, id) => {
  const result = cloneDeep(await boardModel.getDetails(userId, id))

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')
  }

  result.columns = result.columns.map((column) => {
    column.cards = result.cards.filter((card) =>
      card.columnId.equals(column._id)
    )
    return column
  })

  delete result.cards

  return result
}

const updateBoard = async (id, data) => {
  const result = await boardModel.updateBoard(id, {
    ...data,
    updatedAt: Date.now()
  })

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')
  }

  return result
}

const moveCardToAnotherColumn = async (data) => {
  // * Cập nhật lại cardOrderIds của column ban đầu
  await columnModel.updateColumn(data.fromColumnId, {
    cardOrderIds: data.cardOrderIdsOfOldColumn,
    updatedAt: Date.now()
  })

  // * Cập nhật lại cardOrderIds của column mới
  await columnModel.updateColumn(data.toColumnId, {
    cardOrderIds: data.cardOrderIdsOfNewColumn,
    updatedAt: Date.now()
  })

  // * Cập nhật lại columnId của card
  const result = await cardModel.updateCard(data.cardId, {
    columnId: data.toColumnId,
    updatedAt: Date.now()
  })

  // * Trả về card đã di chuyển
  return {
    card: result,
    updated: true
  }
}

const getBoards = async (userId, page, limit, queryFilters) => {
  const result = await boardModel.getBoards(
    userId,
    parseInt(page || DEFAULT_PAGE, 10),
    parseInt(limit || DEFAULT_LIMIT_PER_PAGE, 10),
    queryFilters
  )

  return result
}

const removeUserFromBoard = async (userId, userIdToRemove, boardId) => {
  const board = await boardModel.findOneById(boardId)

  if (!board) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')
  }

  if (!board?.ownerIds?.map((id) => id.toString()).includes(userId)) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You are not the owner of this board!'
    )
  }

  if (board?.ownerIds?.map((id) => id.toString()).includes(userIdToRemove)) {
    throw new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      'You cannot remove the owner of the board!'
    )
  }

  if (userId === userIdToRemove) {
    throw new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      'You cannot remove yourself from the board!'
    )
  }

  const allCardContainUser = await cardModel.findAllCardContainUser(
    board._id,
    userIdToRemove
  )

  let listCardToRemoveUser = []

  if (allCardContainUser.length > 0) {
    allCardContainUser.forEach(async (card) => {
      const updatedCard = await cardModel.updateMembers(card._id, {
        userId: userIdToRemove,
        action: CARD_MEMBER_ACTIONS.REMOVE
      })
      listCardToRemoveUser.push(updatedCard)
    })
  }

  return {
    ...(await boardModel.pullMemberIds(board._id, userIdToRemove)),
    listCardToRemoveUser
  }
}

export const boardService = {
  createBoard,
  getDetails,
  updateBoard,
  moveCardToAnotherColumn,
  getBoards,
  removeUserFromBoard
}
