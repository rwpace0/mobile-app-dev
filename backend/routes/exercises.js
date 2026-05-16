import express from 'express';
import { getExercises, createExercise, getExerciseById, updateExercise, deleteExercise } from '../controller/exercisesController.js';
import { getSetsForExercise } from '../controller/setsController.js';
// Rate limiting disabled for now — see middleware/rateLimiters.js (exerciseLimiter).
// import { exerciseLimiter } from '../middleware/rateLimiters.js';
// router.use(exerciseLimiter);

const router = express.Router();

router.get('/', getExercises);
router.get('/:exerciseId', getExerciseById);
router.get('/:exercise_id/history', getSetsForExercise);
router.post('/create', createExercise);
router.put('/:exerciseId', updateExercise);
router.delete('/:exerciseId', deleteExercise);

export default router;