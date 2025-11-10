// server/src/routes/pharmacyRoutes.ts

import { Router } from 'express';
import { PharmacyController } from '../controllers/pharmacyController';
import { Database } from 'sqlite3';

export const createPharmacyRoutes = (db: Database): Router => {
  const router = Router();
  const pharmacyController = new PharmacyController(db);

  router.get('/', pharmacyController.getAllPharmacies);
  router.get('/count', pharmacyController.getPharmacyCount);
  router.get('/:id', pharmacyController.getPharmacyById);
  router.post('/', pharmacyController.createPharmacy);
  router.put('/:id', pharmacyController.updatePharmacy);
  router.delete('/:id', pharmacyController.deletePharmacy);

  return router;
};