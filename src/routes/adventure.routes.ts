import { Router } from 'express';
import { getAdventures, getAdventureById, bookAdventure, getUserAdventureBookings } from '@controllers/adventure.controller';

const router = Router();

router.get('/', getAdventures);
router.get('/:id', getAdventureById);
router.post('/book', bookAdventure);
router.get('/bookings', getUserAdventureBookings);

export default router;
