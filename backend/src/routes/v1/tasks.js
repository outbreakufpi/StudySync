import express from 'express';
import { listTasks, addTask, updateTask, removeTask } from '../../controllers/tasksController.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', requireAuth, listTasks);
router.post('/', requireAuth, addTask);
router.patch('/:taskId', requireAuth, updateTask);
router.delete('/:taskId', requireAuth, removeTask);

export default router;
