import express from 'express';
import v1Router from './v1/index.js';

const router = express.Router();

// Root route for the API and versioned routing.
router.get('/', (req, res) => res.json({ message: 'StudySync API' }));
router.use('/v1', v1Router);

export default router;
