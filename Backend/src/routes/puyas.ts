import { Router } from 'express'
import { coordPuyas, curva20s, curva5s, puyas_info, tracker } from '../controllers/coord'

const router = Router()

router.get('/puyas', coordPuyas)
router.get('/puyas_info', puyas_info)
router.get('/track', tracker)
router.get('/curva20s', curva20s)
router.get('/curva5s', curva5s)
export default router
