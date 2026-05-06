import express from 'express';
import { signup, login, logout, resetPassword, validateSession } from '../../controllers/authController.js';

const router = express.Router();

// POST /api/v1/auth/signup
router.post('/signup', signup);

// POST /api/v1/auth/login
router.post('/login', login);

// POST /api/v1/auth/logout
router.post('/logout', logout);

// POST /api/v1/auth/reset-password
router.post('/reset-password', resetPassword);

// GET /api/v1/auth/validate-session
router.get('/validate-session', validateSession);

export default router;
<parameter name="filePath">c:\Users\yuria\Desktop\UFPI\StudySync\backend\src\routes\v1\auth.js