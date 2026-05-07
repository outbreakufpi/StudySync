import express from 'express';
import { signup, login, logout, resetPassword, validateSession, me, updateMe } from '../../controllers/authController.js';

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

// GET /api/v1/auth/me
router.get('/me', me);

// PATCH /api/v1/auth/me
router.patch('/me', updateMe);

export default router;
