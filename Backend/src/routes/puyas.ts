import { Router } from 'express'
import { coordPuyas } from '../controllers/coord'

const router = Router()

router.get('/puyas', coordPuyas)

export default router
