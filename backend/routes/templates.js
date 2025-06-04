import express from 'express';
import { createTemplate, getTemplates } from '../controller/templatesController.js';

const router = express.Router();

// Create a new template
router.post('/create', createTemplate);

// Get user's templates
router.get('/', getTemplates);

export default router; 