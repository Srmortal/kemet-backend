import { Router } from 'express';
import { getGuides, getGuideById, bookGuide } from '../controllers/guide.controller';

const router = Router();

router.post('/book',bookGuide);

router.get('/', getGuides);

router.get('/:id', getGuideById);

export default router;
