import { Request, Response } from 'express';
import { ShoufService } from '@services/shouf.service';

const service = (() => {
  try {
    return new ShoufService();
  } catch (e) {
    // Defer error to first request to avoid startup crash
    return null;
  }
})();

export async function getShoufCollectionProducts(_req: Request, res: Response) {
  try {
    if (!service) throw new Error('Shouf integration not configured');
    // Egypt-only products - no collection parameter needed
    const items = await service.listCollectionProducts();
    res.json({ items, count: items.length });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
}

export async function getShoufProductBySlug(req: Request, res: Response) {
  try {
    if (!service) throw new Error('Shouf integration not configured');
    // Egypt-only product endpoint - ID to handle mapping
    const { id } = req.params;
    const productId = String(id);
    
    // Get handle from ID using the mapping
    const handle = await service.getHandleById(productId);
    if (!handle) {
      return res.status(404).json({ error: `Product ID ${productId} not found` });
    }
    
    const data = await service.getProductBySlug(handle);
    return res.json(data);
  } catch (err) {
    return res.status(502).json({ error: (err as Error).message });
  }
}

export async function getShoufCollectionProductsRaw(_req: Request, res: Response) {
  try {
    if (!service) throw new Error('Shouf integration not configured');
    // Egypt-only products from cairo collection - no collection parameter needed
    const path = `/collections/cairo/products.json`;
    const data = await service.fetchRaw(path);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
}

export async function getShoufProductBySlugRaw(req: Request, res: Response) {
  try {
    if (!service) throw new Error('Shouf integration not configured');
    const { id } = req.params;
    const productId = String(id);
    
    // Get handle from ID using the mapping
    const handle = await service.getHandleById(productId);
    if (!handle) {
      return res.status(404).json({ error: `Product ID ${productId} not found` });
    }
    
    const path = `/products/${encodeURIComponent(handle)}.json`;
    const data = await service.fetchRaw(path);
    return res.json(data);
  } catch (err) {
    return res.status(502).json({ error: (err as Error).message });
  }
}
