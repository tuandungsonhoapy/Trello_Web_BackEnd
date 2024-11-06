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

router
  .route('/logout')
  .delete(authMiddleware.isAuthorized, userController.logout)

router.route('/refresh-token').get(userController.refreshToken)

router
  .route('/update')
  .put(
    authMiddleware.isAuthorized,
    multerMiddleware.upload.single('avatar'),
    userValidation.updateUser,
    userController.updateUser
  )

router
  .route('/get-2fa-qr-code')
  .get(authMiddleware.isAuthorized, userController.get2faQRCode)

router
  .route('/enable-2fa')
  .post(authMiddleware.isAuthorized, userController.enable2fa)

router
  .route('/verify-2fa')
  .put(authMiddleware.isAuthorized, userController.verify2fa)

router
  .route('/disable-2fa')
  .put(authMiddleware.isAuthorized, userController.disable2fa)

export const userRoute = router
