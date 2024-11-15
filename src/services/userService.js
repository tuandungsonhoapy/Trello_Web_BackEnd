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
import { authenticator } from 'otplib'
import qrcode from 'qrcode'
import { userSessionsModel } from '~/models/userSessionsModel'

const SERVICE_NAME = '2FA Trello Web'

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
  const verificationLink = `${WEB_DOMAIN}/verify-account?email=${user.email}&token=${user.verifyToken}`
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
      StatusCodes.BAD_REQUEST,
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
      StatusCodes.BAD_REQUEST,
      'Email or password is incorrect!'
    )
  }

  let checkUserSession = await userSessionsModel.findByUserIdAndUserAgent(
    user._id,
    data.userAgent
  )

  if (!checkUserSession && user.require_2fa) {
    const result = await userSessionsModel.createUserSession({
      userId: user._id.toString(),
      userAgent: data.userAgent,
      is_2fa_verified: false
    })

    checkUserSession = await userSessionsModel.findOneById(result.insertedId)
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
    ...pickUser(user),
    is_2fa_verified: checkUserSession?.is_2fa_verified,
    last_login: checkUserSession?.last_login
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
    throw new ApiError(StatusCodes.FORBIDDEN, 'Your account is not activated!')
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

const get2faQRCode = async (userId) => {
  const user = await userModel.findOneById(userId)
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found!')
  }

  let twoFASecretKey = null

  if (!user.secretKey_2fa) {
    twoFASecretKey = authenticator.generateSecret()
    await userModel.updateUser(userId, { secretKey_2fa: twoFASecretKey })
  } else {
    twoFASecretKey = user.secretKey_2fa
  }

  // Create OTP token
  const otpToken = authenticator.keyuri(
    user.email,
    SERVICE_NAME,
    twoFASecretKey
  )

  // Create QR code
  const qrCode = await qrcode.toDataURL(otpToken)

  return { qrCode }
}

const enable2fa = async (userId, data) => {
  const user = await userModel.findOneById(userId)
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found!')
  }
  if (!user.secretKey_2fa) {
    throw new ApiError(StatusCodes.BAD_REQUEST, '2FA is not enabled!')
  }

  const isValid = authenticator.verify({
    token: data.otpToken,
    secret: user.secretKey_2fa
  })

  if (!isValid) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid OTP token!')
  }

  const updatedUser = await userModel.updateUser(userId, {
    require_2fa: true
  })

  const result = await userSessionsModel.createUserSession({
    userId: userId.toString(),
    userAgent: data.userAgent,
    is_2fa_verified: true
  })

  const userSession = await userSessionsModel.findOneById(result.insertedId)

  return {
    ...pickUser(updatedUser),
    is_2fa_verified: userSession.is_2fa_verified,
    last_login: userSession.last_login
  }
}

const deleteUserSession = async (userId, userAgent) => {
  return await userSessionsModel.deleteByUserIdAndUserAgent(userId, userAgent)
}

const verify2fa = async (userId, data) => {
  const user = await userModel.findOneById(userId)
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found!')
  }
  if (!user.secretKey_2fa) {
    throw new ApiError(StatusCodes.BAD_REQUEST, '2FA is not enabled!')
  }

  const isValid = authenticator.verify({
    token: data.otpToken,
    secret: user.secretKey_2fa
  })

  if (!isValid) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid OTP token!')
  }

  const updatedUserSession = await userSessionsModel.update(
    user._id,
    data.userAgent,
    {
      is_2fa_verified: true
    }
  )

  return {
    ...pickUser(user),
    is_2fa_verified: updatedUserSession.is_2fa_verified,
    last_login: updatedUserSession.last_login
  }
}

const disable2fa = async (userId, data) => {
  const user = await userModel.findOneById(userId)
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found!')
  }
  if (!user.secretKey_2fa) {
    throw new ApiError(StatusCodes.BAD_REQUEST, '2FA is not enabled!')
  }

  const isValid = authenticator.verify({
    token: data.otpToken,
    secret: user.secretKey_2fa
  })

  if (!isValid) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid OTP token!')
  }

  await userSessionsModel.deleteByUserIdAndUserAgent(userId, data.userAgent)

  const updatedUser = await userModel.updateUser(userId, {
    require_2fa: false
  })

  return pickUser(updatedUser)
}

export const userService = {
  createUser,
  verifyAccount,
  login,
  refreshToken,
  updateUser,
  get2faQRCode,
  enable2fa,
  deleteUserSession,
  verify2fa,
  disable2fa
}
