import express from 'express';
import { createWorkout, getWorkouts, getWorkoutById } from '../controller/workoutsController.js';
// finishWorkout will be added to the controller next
import { finishWorkout } from '../controller/workoutsController.js';
import { getWorkoutCountsByWeek } from '../controller/workoutsController.js';

const router = express.Router();

router.post('/create', createWorkout);
router.get('/weekly-counts', getWorkoutCountsByWeek);
router.get('/', getWorkouts);
router.post('/finish', finishWorkout);
router.get('/:id', getWorkoutById);

export default router; 