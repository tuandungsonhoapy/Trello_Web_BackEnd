import express from 'express'

import { columnValidation } from '~/validations/columnValidation'
import { columnController } from '~/controllers/columnController'

const router = express.Router()

router
  .route('/')
  .post(columnValidation.createColumn, columnController.createColumn)

router
  .route('/:id')
  .put(columnValidation.updateColumn, columnController.updateColumn)
  .delete(columnValidation.deleteColumn, columnController.deleteColumn)

export const columnRoute = router
