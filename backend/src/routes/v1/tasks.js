import express from 'express';
import { listTasks } from '../../controllers/tasksController.js';

const router = express.Router();

router.get('/', listTasks);

export default router;
