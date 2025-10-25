import { Router } from 'express'
import { coordPuyas, puyas_info, tracker } from '../controllers/coord'

const router = Router()

router.get('/puyas', coordPuyas)
router.get('/puyas_info', puyas_info)
router.get('/track', tracker)
export default router
