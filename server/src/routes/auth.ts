import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();

// POST /api/auth/login - Admin login
router.post('/login', AuthController.login);

// POST /api/auth/logout - Admin logout (optional)
router.post('/logout', AuthController.logout);

// POST /api/auth/verify-token - Verify token validity (matches frontend)
router.post('/verify-token', AuthController.verifyToken);

export default router;