import { env } from '~/config/environment'

export const WHITELIST_DOMAINS = ['https://trello-web-front-end.vercel.app']

export const BOARD_TYPES = {
  PUBLIC: 'public',
  PRIVATE: 'private'
}

export const USER_ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client'
}

export const WEB_DOMAIN =
  env.BUILD_MODE === 'dev' ? env.WEB_DOMAIN_DEV : env.WEB_DOMAIN_PROD

export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT_PER_PAGE = 12

export const INVITATION_TYPES = {
  BOARD_INVITATION: 'BOARD_INVITATION'
}

export const BOARD_INVITATION_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED'
}

export const CARD_MEMBER_ACTIONS = {
  ADD: 'ADD',
  REMOVE: 'REMOVE'
}
