import axios, { AxiosInstance } from 'axios';

export type ShoufProduct = {
  id: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string; // Always EGP for Egypt products
  image?: string;
  imageUrl?: string;
  rating?: number;
  reviews?: number;
  availability?: string;
  duration?: string;
};

export class ShoufService {
  private client: AxiosInstance;
  private base: string;
  private collectionsProductsPath: string;
  private productsPath: string;
  private idToHandleMap: Map<string, string> = new Map();
  private mapLoaded: boolean = false;

  constructor() {
    this.base = process.env.SHOUF_API_BASE || 'https://www.shouf.io';
    if (!this.base) {
      throw new Error('SHOUF_API_BASE env var is required');
    }
    this.collectionsProductsPath = process.env.SHOUF_COLLECTIONS_PRODUCTS_PATH || '/collections/{collection}/products.json';
    this.productsPath = process.env.SHOUF_PRODUCTS_PATH || '/products/{slug}.json';
    this.client = axios.create({
      baseURL: this.base,
      timeout: Number(process.env.SHOUF_TIMEOUT || 20000),
      headers: {
        'User-Agent': 'kemet-backend/1.0',
        'Accept': 'application/json',
      },
    });
  }

  async listCollectionProducts(): Promise<ShoufProduct[]> {
    // Egypt-only products from cairo collection
    const collection = 'cairo';
    const path = this.collectionsProductsPath.replace('{collection}', encodeURIComponent(collection));
    const { data } = await this.client.get(path, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': `${this.base}/#/collections/${collection}`,
      },
    });
    const products = this.toProducts(data);
    // Build ID-to-handle map
    this.buildIdHandleMap(data);
    return products;
  }

  private buildIdHandleMap(data: any): void {
    const products = Array.isArray(data)
      ? data
      : Array.isArray(data?.products)
        ? data.products
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data)
            ? data.data
            : [];
    
    products.forEach((p: any) => {
      const id = String(p.id ?? p.productId ?? p.handle ?? '');
      const handle = String(p.handle ?? '');
      if (id && handle) {
        this.idToHandleMap.set(id, handle);
      }
    });
    this.mapLoaded = true;
  }

  async getHandleById(id: string): Promise<string | null> {
    // Return from cache if available
    if (this.idToHandleMap.has(id)) {
      return this.idToHandleMap.get(id) || null;
    }
    
    // If map not loaded, load it
    if (!this.mapLoaded) {
      await this.listCollectionProducts();
    }
    
    return this.idToHandleMap.get(id) || null;
  }

  async getProductBySlug(slug: string): Promise<ShoufProduct> {
    // Egypt-only product endpoint - no country parameter needed
    const path = this.productsPath.replace('{slug}', encodeURIComponent(slug));
    const { data } = await this.client.get(path, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': `${this.base}/#/products/${slug}`,
      },
    });
    // Handle nested product structure from raw response
    const productData = data?.product || data;
    return this.mapProduct(productData);
  }

  public async fetchRaw(path: string, params?: Record<string, any>): Promise<any> {
    const { data } = await this.client.get(path, {
      params,
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': this.base,
      },
    });
    return data;
  }

  private toProducts(data: any): ShoufProduct[] {
    const arr = Array.isArray(data)
      ? data
      : Array.isArray(data?.products)
        ? data.products
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data)
            ? data.data
            : [];
    return arr.map(this.mapProduct);
  }

  private mapProduct = (p: any): ShoufProduct => ({
    id: String(p.id ?? p.productId ?? p.handle ?? ''),
    name: String(p.name ?? p.title ?? p.productName ?? ''),
    description: p.description ?? p.summary ?? undefined,
    price: typeof p.price === 'number' ? p.price : undefined,
    currency: 'EGP', // Egypt-only products always in EGP
    image: p.image ?? p.imageUrl ?? p.photo ?? undefined,
    imageUrl: p.imageUrl ?? p.image ?? undefined,
    rating: typeof p.rating === 'number' ? p.rating : undefined,
    reviews: typeof p.reviews === 'number' ? p.reviews : undefined,
    availability: p.availability ?? p.status ?? undefined,
    duration: p.duration ?? p.durationText ?? undefined,
  });
}
