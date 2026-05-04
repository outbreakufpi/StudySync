import express from 'express';
import { listSessions } from '../../controllers/sessionsController.js';

const router = express.Router();

router.get('/', listSessions);

export default router;
