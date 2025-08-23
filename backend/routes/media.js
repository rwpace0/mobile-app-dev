import express from 'express';
import { uploadAvatar, uploadExerciseMedia, deleteMedia, getAvatar, getExerciseMedia } from '../controller/mediaController.js';
import { uploadAvatar as avatarMiddleware, uploadExerciseMedia as exerciseMediaMiddleware, handleMulterError } from '../media/fileValidation.js';
import { verifyToken } from '../auth/verifyToken.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Handle avatar uploads
router.post('/avatar', avatarMiddleware, handleMulterError, uploadAvatar);

// Serve avatar images
router.get('/avatar/:userId', getAvatar);

// Serve exercise media
router.get('/exercise/:exerciseId', getExerciseMedia);

// Handle exercise media uploads
router.post('/exercise', exerciseMediaMiddleware, handleMulterError, uploadExerciseMedia);

// Handle media deletion
router.delete('/', deleteMedia);

export default router; 