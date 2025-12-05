import { Router } from 'express';
import { getShoufCollectionProducts, getShoufProductBySlug, getShoufCollectionProductsRaw, getShoufProductBySlugRaw } from '@controllers/shouf.controller';

const router = Router();

router.get('/products', getShoufCollectionProducts);
router.get('/products/raw', getShoufCollectionProductsRaw);
router.get('/products/:id', getShoufProductBySlug);
router.get('/products/:id/raw', getShoufProductBySlugRaw);

export default router;
