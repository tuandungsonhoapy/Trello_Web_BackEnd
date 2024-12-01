import { StatusCodes } from 'http-status-codes'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/config/environment'
import ApiError from '~/utils/ApiError'
import { USER_ROLES } from '~/utils/constants'

const isAuthorized = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.accessToken
    if (!accessToken) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized!')
    }

    const decoded = JwtProvider.verifyToken(
      accessToken,
      env.ACCESS_TOKEN_SECRET_SIGNATURE
    )

    req.jwtDecoded = decoded

    next()
  } catch (error) {
    if (error?.message?.includes('jwt expired')) {
      next(new ApiError(StatusCodes.GONE, 'Need to refresh token!'))
      return
    }

    next(error)
  }
}

const isAuthorizedAndAdmin = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.accessToken
    if (!accessToken) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized!')
    }

    const decoded = JwtProvider.verifyToken(
      accessToken,
      env.ACCESS_TOKEN_SECRET_SIGNATURE
    )

    if (decoded.role !== USER_ROLES.ADMIN) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have permission!')
    }

    req.jwtDecoded = decoded

    next()
  } catch (error) {
    if (error?.message?.includes('jwt expired')) {
      next(new ApiError(StatusCodes.GONE, 'Need to refresh token!'))
      return
    }

    next(error)
  }
}

export const authMiddleware = {
  isAuthorized,
  isAuthorizedAndAdmin
}
