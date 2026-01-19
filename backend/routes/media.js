import express from 'express';
import { uploadAvatar, uploadExerciseMedia, uploadExerciseVideo, deleteMedia, getAvatar, getExerciseMedia } from '../controller/mediaController.js';
import { uploadAvatar as avatarMiddleware, uploadExerciseMedia as exerciseMediaMiddleware, uploadExerciseVideo as exerciseVideoMiddleware, handleMulterError } from '../media/fileValidation.js';
import { verifyToken } from '../auth/verifyToken.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Handle avatar uploads
router.post('/avatar', avatarMiddleware, handleMulterError, uploadAvatar);

// Serve avatar images
router.get('/avatar/:userId', getAvatar);

// Serve exercise media (images and videos)
router.get('/exercise/:exerciseId', getExerciseMedia);

// Handle exercise image uploads
router.post('/exercise', exerciseMediaMiddleware, handleMulterError, uploadExerciseMedia);

// Handle exercise video uploads (only for public/default exercises)
router.post('/exercise/video', exerciseVideoMiddleware, handleMulterError, uploadExerciseVideo);

// Handle media deletion
router.delete('/', deleteMedia);

export default router; 