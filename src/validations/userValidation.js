import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { EMAIL_RULE, EMAIL_RULE_MESSAGE } from '~/utils/validators'

const createUser = async (req, res, next) => {
  const validationCondition = Joi.object({
    email: Joi.string()
      .required()
      .pattern(EMAIL_RULE)
      .message(EMAIL_RULE_MESSAGE),
    password: Joi.string().required().min(6).trim().strict()
  })

  try {
    await validationCondition.validateAsync(req.body, { abortEarly: false })

    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, error.message))
  }
}

const verifyAccount = async (req, res, next) => {
  const validationCondition = Joi.object({
    email: Joi.string()
      .required()
      .pattern(EMAIL_RULE)
      .message(EMAIL_RULE_MESSAGE),
    token: Joi.string().required().trim().strict()
  })

  try {
    await validationCondition.validateAsync(req.body, { abortEarly: false })

    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, error.message))
  }
}

const login = async (req, res, next) => {
  const validationCondition = Joi.object({
    email: Joi.string()
      .required()
      .pattern(EMAIL_RULE)
      .message(EMAIL_RULE_MESSAGE),
    password: Joi.string().required().min(6).trim().strict()
  })

  try {
    await validationCondition.validateAsync(req.body, { abortEarly: false })

    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, error.message))
  }
}

const updateUser = async (req, res, next) => {
  const validationCondition = Joi.object({
    displayName: Joi.string().trim().strict().min(3).max(50),
    current_password: Joi.string()
      .min(6)
      .trim()
      .strict()
      .message('Current password is required and at least 6 characters!'),
    new_password: Joi.string()
      .min(6)
      .trim()
      .strict()
      .message('New password is required and at least 6 characters!')
  })

  try {
    await validationCondition.validateAsync(req.body, {
      abortEarly: false,
      allowUnknown: true
    })

    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, error.message))
  }
}

export const userValidation = {
  createUser,
  verifyAccount,
  login,
  updateUser
}
