import { Router } from 'express';
import { getAdventures, getAdventureById, bookAdventure, getUserAdventureBookings } from '@controllers/adventure.controller';
import { firebaseAuth } from '@middleware/firebaseAuth';

const router = Router();

router.get('/', getAdventures);
router.get('/:id', getAdventureById);

// Booking endpoints (require auth)
router.use(firebaseAuth);
router.post('/book', bookAdventure);
router.get('/bookings', getUserAdventureBookings);

export default router;
