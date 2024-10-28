import express from 'express'
import { userValidation } from '~/validations/userValidation'
import { userController } from '~/controllers/userController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { multerMiddleware } from '~/middlewares/multerMiddleware'

const router = express.Router()

router
  .route('/register')
  .post(userValidation.createUser, userController.createUser)

router
  .route('/verify')
  .put(userValidation.verifyAccount, userController.verifyAccount)

router.route('/login').post(userValidation.login, userController.login)

router.route('/logout').delete(userController.logout)

router.route('/refresh-token').get(userController.refreshToken)

router
  .route('/update')
  .put(
    authMiddleware.isAuthorized,
    multerMiddleware.upload.single('avatar'),
    userValidation.updateUser,
    userController.updateUser
  )

export const userRoute = router
