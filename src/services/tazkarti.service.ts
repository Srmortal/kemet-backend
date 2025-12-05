import axios, { AxiosInstance } from 'axios';

export type TazkartiEvent = {
  id: string;
  name: string;
  date?: string;
  venue?: string;
  city?: string;
  category?: string;
};

export class TazkartiService {
  private client: AxiosInstance;
  private base: string;
  private eventsPath: string;
  private matchesPath: string;
  private eventCategoriesPath: string;
  private imageBase: string;
  private eventDetailBasePath: string;

  constructor() {
    this.base = process.env.TAZKARTI_API_BASE || '';
    if (!this.base) {
      throw new Error('TAZKARTI_API_BASE env var is required');
    }
    this.eventsPath = process.env.TAZKARTI_EVENTS_PATH || '/data/events-list-json.json';
    this.matchesPath = process.env.TAZKARTI_MATCHES_PATH || '/matches';
    this.eventCategoriesPath = process.env.TAZKARTI_EVENT_CATEGORIES_PATH || '/data/eventcategory-list.json';
    this.imageBase = process.env.TAZKARTI_IMAGE_BASE || 'https://www.tazkarti.com/assets/images/events/';
    this.eventDetailBasePath = process.env.TAZKARTI_EVENT_DETAIL_BASE_PATH || '/bookenter/Entertainment/events';
    this.client = axios.create({
      baseURL: this.base,
      timeout: Number(process.env.TAZKARTI_TIMEOUT || 20000),
      headers: {
        'User-Agent': 'kemet-backend/1.0',
        'Accept': 'application/json',
      },
    });
  }

  public async fetchRaw(path: string, params?: Record<string, any>): Promise<any> {
    const { data } = await this.client.get(path, {
      params,
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.tazkarti.com/#/home',
      },
    });
    return data;
  }

  async getEventById(id: string): Promise<any> {
    const path = `${this.eventDetailBasePath}/${encodeURIComponent(id)}`;
    const { data, headers } = await this.client.get(path, {
      headers: {
        'Accept': 'application/json, text/html, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.tazkarti.com/#/home',
      },
    });
    // If HTML is returned, just proxy it through; if JSON, return JSON
    const contentType = String(headers['content-type'] || '');
    if (contentType.includes('text/html')) {
      return { html: typeof data === 'string' ? data : String(data) };
    }
    return data;
  }

  async listEvents(): Promise<TazkartiEvent[]> {
    const url = this.eventsPath;
    const { data } = await this.client.get(url, {
      params: { _: Date.now() },
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.tazkarti.com/#/home',
      },
    });
    return this.toEvents(data);
  }

  async listMatches(): Promise<TazkartiEvent[]> {
    const url = this.matchesPath || '/data/matches-list-json.json';
    const { data } = await this.client.get(url, {
      params: { _: Date.now() },
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.tazkarti.com/#/home',
      },
    });
    return this.toEvents(data);
  }

  async listEventCategories(): Promise<any[]> {
    const url = this.eventCategoriesPath;
    const { data } = await this.client.get(url, {
      params: { _: Date.now() },
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        // Some CDNs expect a referer; mirrors browser requests
        'Referer': 'https://www.tazkarti.com/#/home',
      },
    });
    // Return raw payload; caller will shape as needed
    return data;
  }

  async listEventCategoriesNormalized(): Promise<Array<{ id: number; name: string; nameAr?: string; order?: number; image?: string; imageUrl?: string }>> {
    const raw: any = await this.listEventCategories();
    const arr: any[] = Array.isArray(raw)
      ? raw
      : (Array.isArray(raw?.items) ? raw.items : []);
    return arr.map((c: any) => {
      const img = typeof c.image === 'string' ? c.image : undefined;
      const imageUrl = img ? this.resolveImageUrl(img) : undefined;
      return {
        id: Number(c.id),
        name: String(c.name ?? ''),
        nameAr: c.nameAr ?? undefined,
        order: typeof c.orderNumber === 'number' ? c.orderNumber : undefined,
        image: img,
        imageUrl,
      };
    });
  }

  private resolveImageUrl(filename: string): string {
    try {
      if (filename.startsWith('http')) return filename;
      // Ensure single slash join
      const base = this.imageBase.endsWith('/') ? this.imageBase : this.imageBase + '/';
      return base + filename.replace(/^\//, '');
    } catch {
      return filename;
    }
  }

  private toEvents(data: any): TazkartiEvent[] {
    const arr = Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.list)
            ? data.list
            : [];
    return arr.map(this.mapEvent);
  }

  private mapEvent = (e: any): TazkartiEvent => ({
    id: String(e.id ?? e.eventId ?? e.matchId ?? ''),
    name: String(e.name ?? e.title ?? e.eventName ?? e.matchName ?? ''),
    date: e.date ?? e.eventDate ?? e.matchDate ?? e.startDate ?? undefined,
    venue: e.venue ?? e.stadium ?? e.location ?? e.place ?? undefined,
    city: e.city ?? undefined,
    category: e.category ?? e.type ?? undefined,
  });

  async listEventsNormalized(): Promise<Array<{ id: string; name: string; date?: string; venue?: string; city?: string; category?: string; imageUrl?: string }>> {
    const raw: any = await this.client.get(this.eventsPath, {
      params: { _: Date.now() },
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.tazkarti.com/#/home',
      },
    }).then(r => r.data);
    const arr: any[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.items) ? raw.items : []);
    return arr.map((e: any) => {
      const image = e.image ?? e.poster ?? e.cover ?? undefined;
      const imageUrl = image ? this.resolveImageUrl(String(image)) : undefined;
      return {
        id: String(e.id ?? e.eventId ?? ''),
        name: String(e.name ?? e.title ?? ''),
        date: e.date ?? e.eventDate ?? e.startDate ?? undefined,
        venue: e.venue ?? e.stadium ?? e.location ?? e.place ?? undefined,
        city: e.city ?? undefined,
        category: e.category ?? e.type ?? undefined,
        imageUrl,
      };
    });
  }
}
