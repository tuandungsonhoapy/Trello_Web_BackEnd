import express from 'express'

import { cardValidation } from '~/validations/cardValidation'
import { cardController } from '~/controllers/cardController'
import { authMiddleware } from '~/middlewares/authMiddleware'

const router = express.Router()

router
  .route('/')
  .post(
    authMiddleware.isAuthorized,
    cardValidation.createCard,
    cardController.createCard
  )

router
  .route('/:id')
  .put(
    authMiddleware.isAuthorized,
    cardValidation.updateCard,
    cardController.updateCard
  )
  .delete(
    authMiddleware.isAuthorized,
    cardValidation.deleteCard,
    cardController.deleteCard
  )

export const cardRoute = router
