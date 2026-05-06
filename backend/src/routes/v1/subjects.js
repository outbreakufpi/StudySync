import express from 'express';
import { listSubjects, addSubject, updateSubject, removeSubject } from '../../controllers/subjectsController.js';
import { requireAuth } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', requireAuth, listSubjects);
router.post('/', requireAuth, addSubject);
router.patch('/:subjectId', requireAuth, updateSubject);
router.delete('/:subjectId', requireAuth, removeSubject);

export default router;
