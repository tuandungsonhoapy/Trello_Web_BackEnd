import { StatusCodes } from 'http-status-codes'
import ms from 'ms'
import { userService } from '~/services/userService'
import ApiError from '~/utils/ApiError'

const createUser = async (req, res, next) => {
  try {
    const result = await userService.createUser(req.body)

    res.status(StatusCodes.CREATED).json(result)
  } catch (error) {
    next(error)
  }
}

const verifyAccount = async (req, res, next) => {
  try {
    const result = await userService.verifyAccount(req.body)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const login = async (req, res, next) => {
  try {
    const result = await userService.login({
      ...req.body,
      userAgent: req.headers['user-agent']
    })

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('7 days')
    })

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('7 days')
    })

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const logout = async (req, res, next) => {
  try {
    await userService.deleteUserSession(
      req.jwtDecoded._id,
      req.headers['user-agent']
    )

    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')

    res.status(StatusCodes.OK).json({ loggedOut: true })
  } catch (error) {
    next(error)
  }
}

const refreshToken = async (req, res, next) => {
  try {
    const result = await userService.refreshToken(req.cookies?.refreshToken)

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('7 days')
    })

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('7 days')
    })

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(new ApiError(StatusCodes.FORBIDDEN, error.message))
  }
}

const updateUser = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const userAvatar = req.file
    const result = await userService.updateUser(userId, req.body, userAvatar)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const get2faQRCode = async (req, res, next) => {
  try {
    const result = await userService.get2faQRCode(req.jwtDecoded._id)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const enable2fa = async (req, res, next) => {
  try {
    const result = await userService.enable2fa(req.jwtDecoded._id, {
      ...req.body,
      userAgent: req.headers['user-agent']
    })

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const verify2fa = async (req, res, next) => {
  try {
    const result = await userService.verify2fa(req.jwtDecoded._id, {
      ...req.body,
      userAgent: req.headers['user-agent']
    })

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const disable2fa = async (req, res, next) => {
  try {
    const result = await userService.disable2fa(req.jwtDecoded._id, {
      ...req.body,
      userAgent: req.headers['user-agent']
    })

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

export const userController = {
  createUser,
  verifyAccount,
  login,
  logout,
  refreshToken,
  updateUser,
  get2faQRCode,
  enable2fa,
  verify2fa,
  disable2fa
}
