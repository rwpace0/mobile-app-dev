import express from 'express';
import { createWorkout, getWorkouts, getWorkoutById, updateWorkout, upsertWorkout, getWorkoutsWithDetails } from '../controller/workoutsController.js';
// finishWorkout will be added to the controller next
import { finishWorkout } from '../controller/workoutsController.js';
import { getWorkoutCountsByWeek } from '../controller/workoutsController.js';

const router = express.Router();

router.post('/create', createWorkout);
router.post('/upsert', upsertWorkout);
router.get('/weekly-counts', getWorkoutCountsByWeek);
router.get('/', getWorkouts);
router.get('/with-details', getWorkoutsWithDetails);
router.post('/finish', finishWorkout);
router.get('/:id', getWorkoutById);
router.put('/:id', updateWorkout);

export default router;