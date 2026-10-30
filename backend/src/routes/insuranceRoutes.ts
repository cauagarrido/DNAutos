import { Router } from 'express';
import { InsuranceController } from '../controllers/insuranceController';

const router = Router();

router.post('/quote', InsuranceController.requestQuote);

export default router;
