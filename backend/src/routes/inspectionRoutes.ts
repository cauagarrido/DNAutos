import { Router } from 'express';
import { InspectionController } from '../controllers/inspectionController';

const router = Router();

router.post('/schedule', InspectionController.schedule);

export default router;
