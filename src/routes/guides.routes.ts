import { Router } from 'express';
import { getGuides, getGuideById } from '../controllers/guide.controller';

const router = Router();

router.get('/', getGuides);

router.get('/:id', getGuideById);

export default router;
