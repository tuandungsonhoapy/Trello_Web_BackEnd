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
