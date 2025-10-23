import { Router } from 'express'
import { coordPuyas, puyas_info } from '../controllers/coord'

const router = Router()

router.get('/puyas', coordPuyas)
router.get('/puyas_info', puyas_info)
export default router
