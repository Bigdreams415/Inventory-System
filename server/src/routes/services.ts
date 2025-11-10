import { Router } from 'express';
import { ServicesController } from '../controllers/servicesController';


const router = Router();

// GET /api/services - Get all services for current pharmacy
router.get('/', ServicesController.getServices);

// POST /api/services - Create new service
router.post('/', ServicesController.createService);

// PUT /api/services/:id - Update service
router.put('/:id', ServicesController.updateService);

// DELETE /api/services/:id - Delete service
router.delete('/:id', ServicesController.deleteService);

// PATCH /api/services/:id/status - Toggle service active status
router.patch('/:id/status', ServicesController.toggleServiceStatus);

// GET /api/services/stats - Get service statistics
router.get('/stats/summary', ServicesController.getServiceStats);

export default router;