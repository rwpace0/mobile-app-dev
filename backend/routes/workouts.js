import express from 'express';
import { createWorkout, getWorkouts, getWorkoutById } from '../controller/workoutsController.js';
// finishWorkout will be added to the controller next
import { finishWorkout } from '../controller/workoutsController.js';

const router = express.Router();

router.post('/create', createWorkout);
router.get('/', getWorkouts);
router.get('/:id', getWorkoutById);
router.post('/finish', finishWorkout);

export default router; 