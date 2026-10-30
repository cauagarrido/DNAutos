import { Router } from 'express';
import vehicleRoutes from './vehicleRoutes';
import checkoutRoutes from './checkoutRoutes';
import fipeRoutes from './fipeRoutes';
import inspectionRoutes from './inspectionRoutes';
import insuranceRoutes from './insuranceRoutes';
import authRoutes from './authRoutes';

const router = Router();

// Rota de Health Check da API
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'DNAutos Vistorias API',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/vehicle', vehicleRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/fipe', fipeRoutes);
router.use('/inspection', inspectionRoutes);
router.use('/insurance', insuranceRoutes);

export default router;
