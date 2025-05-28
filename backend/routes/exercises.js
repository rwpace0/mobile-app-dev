import express from 'express';
import { getExercises, createExercise } from '../controller/exercisesController.js';

const router = express.Router();

router.get('/', getExercises);
router.post('/create', createExercise);

export default router;