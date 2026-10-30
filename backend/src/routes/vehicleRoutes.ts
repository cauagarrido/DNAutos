import { Router } from 'express';
import { VehicleController } from '../controllers/vehicleController';

const router = Router();

// A prévia gratuita fica desativada: cada leitura da API AnyCar pode gerar custo empresarial.
router.get('/preview/:plate', (_req, res) => res.status(402).json({ message: 'A consulta requer login e pagamento.' }));
router.get('/report/:plate', VehicleController.getFullReport);

export default router;
