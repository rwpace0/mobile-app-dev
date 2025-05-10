import express from 'express';
import { getExercises } from '../controller/exercisesController.js';

const router = express.Router();

router.get('/', getExercises);

export default router;