import { Router } from 'express';
import * as tourismController from '@controllers/tourism.controller';

const router = Router();

// Get all activities with filters and pagination
router.get('/', tourismController.getTourismActivities);

// Get activity statistics
router.get('/stats/overview', tourismController.getTourismStats);

// Get available locations
router.get('/locations/list', tourismController.getTourismLocations);

// Get available categories
router.get('/categories/list', tourismController.getTourismCategories);

// Search activities
router.get('/search', tourismController.searchTourismActivities);

// Get activity by ID
router.get('/:id', tourismController.getTourismActivityById);

export default router;
