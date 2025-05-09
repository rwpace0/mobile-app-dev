import express from 'express';
import { testDbConnection } from '../controller/exercisesController.js';

const router = express.Router();

router.get('/', testDbConnection);

export default router;