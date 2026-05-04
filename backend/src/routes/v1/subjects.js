import express from 'express';
import { listSubjects } from '../../controllers/subjectsController.js';

const router = express.Router();

router.get('/', listSubjects);

export default router;
