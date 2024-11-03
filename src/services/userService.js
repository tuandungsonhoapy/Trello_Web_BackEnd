import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import bcryptjs from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { pickUser } from '~/utils/formatters'
import { WEB_DOMAIN } from '~/utils/constants'
import { BrevoProvider } from '~/providers/BrevoProvider'
import { env } from '~/config/environment'
import { JwtProvider } from '~/providers/JwtProvider'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'

const createUser = async (data) => {
  // * Kiểm tra xem email đã tồn tại chưa
  const existedUser = await userModel.findOneByEmail(data.email)
  if (existedUser) {
    throw new ApiError(StatusCodes.CONFLICT, 'Email already exists!')
  }

  // * Lưu user vào database
  const username = data.email.split('@')[0]
  const newUser = {
    username,
    password: bcryptjs.hashSync(data.password, 10),
    email: data.email,
    displayName: username,
    verifyToken: uuidv4()
  }

  const user = await userModel.findOneById(
    (
      await userModel.createUser(newUser)
    ).insertedId
  )

  // * Gửi email xác thực tài khoản
  const verificationLink = `${WEB_DOMAIN}/account/verification?email=${user.email}&token=${user.verifyToken}`
  const customSubject =
    'Trello Web: Please verify your email address to activate your account!'
  const htmlContent = `
    <h2>Welcome to Trello Web!</h2>
    <h4>Please click the link below to verify your email address:</h4>
    <h4>${verificationLink}</h4>
    <h4>If you did not create an account using this email address, please ignore this email.</h4>
  `

  // * Gọi tới provider gửi email
  await BrevoProvider.sendEmail(user.email, customSubject, htmlContent)

  return pickUser(user)
}

const verifyAccount = async (data) => {
  const user = await userModel.findOneByEmail(data.email)

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found!')
  }

  if (user.isActivated) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Account has already activated!'
    )
  }

  if (user.verifyToken !== data.token) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid token!')
  }

  return pickUser(
    await userModel.updateUser(user._id, {
      isActive: true,
      verifyToken: null
    })
  )
}

const login = async (data) => {
  const user = await userModel.findOneByEmail(data.email)

  if (!user) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'Email or password is incorrect!'
    )
  }

  if (!user.isActive) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Your account is not activated!'
    )
  }

  if (!bcryptjs.compareSync(data.password, user.password)) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'Email or password is incorrect!'
    )
  }

  // * Tạo access token
  const accessToken = JwtProvider.generateToken(
    { _id: user._id, email: user.email },
    env.ACCESS_TOKEN_SECRET_SIGNATURE,
    env.ACCESS_TOKEN_LIFE
  )

  const refreshToken = JwtProvider.generateToken(
    { _id: user._id, email: user.email },
    env.REFRESH_TOKEN_SECRET_SIGNATURE,
    env.REFRESH_TOKEN_LIFE
  )

  return {
    accessToken,
    refreshToken,
    ...pickUser(user)
  }
}

const refreshToken = async (refreshToken) => {
  try {
    const decoded = JwtProvider.verifyToken(
      refreshToken,
      env.REFRESH_TOKEN_SECRET_SIGNATURE
    )

    return {
      accessToken: JwtProvider.generateToken(
        { _id: decoded._id, email: decoded.email },
        env.ACCESS_TOKEN_SECRET_SIGNATURE,
        env.ACCESS_TOKEN_LIFE
      ),
      refreshToken: JwtProvider.generateToken(
        { _id: decoded._id, email: decoded.email },
        env.REFRESH_TOKEN_SECRET_SIGNATURE,
        env.REFRESH_TOKEN_LIFE
      )
    }
  } catch (error) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Please sign in!')
  }
}

const updateUser = async (userId, data, userAvatar) => {
  const user = await userModel.findOneById(userId)
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found!')
  }
  if (!user.isActive) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'Your account is not activated!'
    )
  }

  if (data.current_password && data.new_password) {
    if (!bcryptjs.compareSync(data.current_password, user.password)) {
      throw new ApiError(
        StatusCodes.NOT_ACCEPTABLE,
        'Current password is incorrect!'
      )
    }
    return pickUser(
      await userModel.updateUser(userId, {
        password: bcryptjs.hashSync(data.new_password, 10)
      })
    )
  } else if (userAvatar) {
    const uploadResult = await CloudinaryProvider.streamUpload(
      userAvatar.buffer,
      'trelloUsers'
    )

    return pickUser(
      await userModel.updateUser(userId, {
        avatar: uploadResult.secure_url
      })
    )
  } else {
    return pickUser(await userModel.updateUser(userId, data))
  }
}

export const userService = {
  createUser,
  verifyAccount,
  login,
  refreshToken,
  updateUser
}