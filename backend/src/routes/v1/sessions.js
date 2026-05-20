import express from 'express';
import { listSessions, addSession } from '../../controllers/sessionsController.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';

const router = express.Router();
// Protected session routes for study session tracking.

router.get('/', requireAuth, listSessions);
router.post('/', requireAuth, addSession);

export default router;
