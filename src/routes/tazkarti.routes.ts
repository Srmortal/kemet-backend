import { Router } from 'express';
import { getTazkartiEvents, getTazkartiMatches, getTazkartiEventCategories, getTazkartiEventCategoriesNormalized, getTazkartiEventsNormalized, getTazkartiEventsRaw, getTazkartiEventById, getTazkartiMatchesRaw } from '@controllers/tazkarti.controller';

const router = Router();

router.get('/events', getTazkartiEvents);
router.get('/events/normalized', getTazkartiEventsNormalized);
router.get('/events/raw', getTazkartiEventsRaw);
router.get('/events/:id', getTazkartiEventById);
router.get('/matches', getTazkartiMatches);
router.get('/matches/raw', getTazkartiMatchesRaw);
router.get('/event-categories', getTazkartiEventCategories);
router.get('/event-categories/normalized', getTazkartiEventCategoriesNormalized);

export default router;
