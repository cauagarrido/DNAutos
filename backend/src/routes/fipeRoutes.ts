import { Router } from 'express';
import { FipeController } from '../controllers/fipeController';

const router = Router();

router.get('/brands', FipeController.getBrands);
router.get('/models', FipeController.getModels);
router.get('/years', FipeController.getYears);
router.get('/vehicle', FipeController.getVehicleData);

export default router;
