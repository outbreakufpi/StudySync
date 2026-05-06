import express from 'express';
import { listTasks, addTask } from '../../controllers/tasksController.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', requireAuth, listTasks);
router.post('/', requireAuth, addTask);

export default router;
