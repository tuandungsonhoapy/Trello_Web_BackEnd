import express from 'express'

import { columnValidation } from '~/validations/columnValidation'
import { columnController } from '~/controllers/columnController'
import { authMiddleware } from '~/middlewares/authMiddleware'

const router = express.Router()

router
  .route('/')
  .post(
    authMiddleware.isAuthorized,
    columnValidation.createColumn,
    columnController.createColumn
  )

router
  .route('/:id')
  .put(
    authMiddleware.isAuthorized,
    columnValidation.updateColumn,
    columnController.updateColumn
  )
  .delete(
    authMiddleware.isAuthorized,
    columnValidation.deleteColumn,
    columnController.deleteColumn
  )

export const columnRoute = router
