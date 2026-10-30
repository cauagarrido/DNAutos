import { Router } from 'express';
import { CheckoutController } from '../controllers/checkoutController';
import { requireAuth } from '../middlewares/requireAuth';

const router = Router();

router.post('/', requireAuth, CheckoutController.create);
router.get('/status/:paymentId', requireAuth, CheckoutController.status);
router.post('/webhook', CheckoutController.webhook);

export default router;
