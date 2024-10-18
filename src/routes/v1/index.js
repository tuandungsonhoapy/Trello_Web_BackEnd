import express from 'express'
import { boardRoute } from './boardRoute'

const router = express.Router()

router.use('/boards', boardRoute)

export const APIs_V1 = router
