import express from 'express';
import { createTemplate, getTemplates, deleteTemplate, updateTemplate } from '../controller/templatesController.js';

const router = express.Router();

// Create a new template
router.post('/create', createTemplate);

// Update an existing template
router.put('/:templateId', updateTemplate);

// Get user's templates
router.get('/', getTemplates);

// Delete a template
router.delete('/:templateId', deleteTemplate);

export default router; 