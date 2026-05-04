import express from 'express';
import subjectsRouter from './subjects.js';
import tasksRouter from './tasks.js';
import sessionsRouter from './sessions.js';

const router = express.Router();

router.use('/subjects', subjectsRouter);
router.use('/tasks', tasksRouter);
router.use('/sessions', sessionsRouter);

router.get('/', (req, res) => res.json({ version: 'v1' }));

export default router;
