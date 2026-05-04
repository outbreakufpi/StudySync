import express from 'express';
import { listSubjects, addSubject } from '../../controllers/subjectsController.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', requireAuth, listSubjects);
router.post('/', requireAuth, addSubject);

export default router;
