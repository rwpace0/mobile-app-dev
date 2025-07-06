import express from 'express';
import { getProfile, updateProfile } from '../controller/profileController.js';
import { verifyToken } from '../auth/verifyToken.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get user profile
router.get('/', getProfile);

// Update user profile
router.put('/', updateProfile);

export default router; 