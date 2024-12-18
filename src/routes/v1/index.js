import express from 'express'
import { boardRoute } from './boardRoute'
import { columnRoute } from './columnRoute'
import { cardRoute } from './cardRoute'
import { userRoute } from './userRoute'
import { invitationRoute } from './invitationRoute'

const router = express.Router()

router.use('/boards', boardRoute)

router.use('/columns', columnRoute)

router.use('/cards', cardRoute)

router.use('/users', userRoute)

router.use('/invitations', invitationRoute)

export const APIs_V1 = router
