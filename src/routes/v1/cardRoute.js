import express from 'express'

import { cardValidation } from '~/validations/cardValidation'
import { cardController } from '~/controllers/cardController'

const router = express.Router()

router.route('/').post(cardValidation.createCard, cardController.createCard)

router
  .route('/:id')
  .put(cardValidation.updateCard, cardController.updateCard)
  .delete(cardValidation.deleteCard, cardController.deleteCard)

export const cardRoute = router
