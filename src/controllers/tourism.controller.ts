import { Request, Response } from 'express';
import { tourismService } from '@services/tourism.service';

export async function getTourismActivities(req: Request, res: Response) {
  try {
    const { location, category, page = '1', limit = '10', sortBy = 'rating' } = req.query;
    const result = await tourismService.getActivities({
      location: location ? String(location) : undefined,
      category: category ? String(category) : undefined,
      page: parseInt(String(page), 10),
      limit: parseInt(String(limit), 10),
      sortBy: String(sortBy),
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getTourismActivityById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const doc = await tourismService.getActivityById(id);

    if (!doc) {
      res.status(404).json({ error: 'Tourism place not found' });
      return;
    }

    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function searchTourismActivities(req: Request, res: Response): Promise<void> {
  try {
    const { q, page = '1', limit = '10' } = req.query;
    const result = await tourismService.searchActivities(String(q || ''), parseInt(String(page), 10), parseInt(String(limit), 10));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getTourismLocations(_req: Request, res: Response): Promise<void> {
  try {
    const result = await tourismService.getLocations();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getTourismCategories(_req: Request, res: Response): Promise<void> {
  try {
    const result = await tourismService.getCategories();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getTourismStats(_req: Request, res: Response): Promise<void> {
  try {
    const result = await tourismService.getStats();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}
