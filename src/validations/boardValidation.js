import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'

const createBoard = async (req, res, next) => {
  const validationCondition = Joi.object({
    title: Joi.string().required().min(3).max(100).trim().strict(),
    description: Joi.string().required().max(255).trim().strict()
  })

  try {
    await validationCondition.validateAsync(req.body, { abortEarly: false })

    next()
  } catch (error) {
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      error: new Error(error).message
    })
  }
}

export const boardValidation = {
  createBoard
}
