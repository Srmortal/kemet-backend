import { Request, Response } from 'express';
import { TazkartiService } from '@services/tazkarti.service';

const service = (() => {
  try {
    return new TazkartiService();
  } catch (e) {
    // Defer error to first request to avoid startup crash
    return null;
  }
})();

export async function getTazkartiEvents(_req: Request, res: Response) {
  try {
    if (!service) throw new Error('Tazkarti integration not configured');
    const items = await service.listEvents();
    res.json({ items, count: items.length });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
}

export async function getTazkartiEventsRaw(_req: Request, res: Response) {
  try {
    if (!service) throw new Error('Tazkarti integration not configured');
    const data = await service.fetchRaw(process.env.TAZKARTI_EVENTS_PATH || '/data/events-list-json.json', { _: Date.now() });
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
}

export async function getTazkartiMatches(_req: Request, res: Response) {
  try {
    if (!service) throw new Error('Tazkarti integration not configured');
    const items = await service.listMatches();
    res.json({ items, count: items.length });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
}

export async function getTazkartiMatchesRaw(_req: Request, res: Response) {
  try {
    if (!service) throw new Error('Tazkarti integration not configured');
    const data = await service.fetchRaw(process.env.TAZKARTI_MATCHES_PATH || '/data/matches-list-json.json', { _: Date.now() });
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
}

export async function getTazkartiEventCategories(_req: Request, res: Response) {
  try {
    if (!service) throw new Error('Tazkarti integration not configured');
    const data = await service.listEventCategories();
    // If array: wrap into items/count; else return raw
    if (Array.isArray(data)) {
      res.json({ items: data, count: data.length });
    } else {
      res.json(data);
    }
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
}

export async function getTazkartiEventCategoriesNormalized(_req: Request, res: Response) {
  try {
    if (!service) throw new Error('Tazkarti integration not configured');
    const items = await service.listEventCategoriesNormalized();
    res.json({ items, count: items.length });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
}

export async function getTazkartiEventsNormalized(_req: Request, res: Response) {
  try {
    if (!service) throw new Error('Tazkarti integration not configured');
    const items = await service.listEventsNormalized();
    res.json({ items, count: items.length });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
}

export async function getTazkartiEventById(req: Request, res: Response) {
  try {
    if (!service) throw new Error('Tazkarti integration not configured');
    const { id } = req.params;
    const data = await service.getEventById(String(id));
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
}
