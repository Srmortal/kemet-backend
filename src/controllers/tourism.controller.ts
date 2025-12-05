import { Request, Response } from 'express';
import { firebaseAdmin } from '@config/firebase';

const COLLECTION = 'tourism_activities_egypt';
const PAGE_SIZE = 20;

export async function getTourismActivities(req: Request, res: Response) {
  try {
    const { location, category, page = '1', limit = PAGE_SIZE.toString(), sortBy = 'rating' } = req.query;
    const pageNum = Math.max(1, parseInt(String(page)) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(String(limit)) || PAGE_SIZE));

    const db = firebaseAdmin.firestore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = db.collection(COLLECTION);

    // Apply filters
    if (location) {
      query = query.where('location', '==', String(location));
    }

    if (category) {
      query = query.where('category', '==', String(category));
    }

    // Apply sorting
    const sortMap: Record<string, string> = {
      'rating': 'rating',
      '-rating': 'rating',
      'price': 'price',
      '-price': 'price',
      'duration': 'duration',
      '-duration': 'duration',
    };

    const sortField = sortMap[String(sortBy)] || 'rating';
    const isDescending = String(sortBy).startsWith('-');

    if (isDescending) {
      query = query.orderBy(sortField, 'desc');
    } else {
      query = query.orderBy(sortField, 'asc');
    }

    // Get total count
    const countSnapshot = await query.count().get();
    const totalCount = countSnapshot.data().count;

    // Pagination
    const skip = (pageNum - 1) * pageSize;
    const snapshot = await query.offset(skip).limit(pageSize).get();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activities = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const totalPages = Math.ceil(totalCount / pageSize);

    res.json({
      data: activities,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total: totalCount,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
      filters: {
        location: location || null,
        category: category || null,
        sortBy,
      },
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getTourismActivityById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const db = firebaseAdmin.firestore();
    const doc = await db.collection(COLLECTION).doc(id).get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }

    res.json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function searchTourismActivities(req: Request, res: Response): Promise<void> {
  try {
    const { q, page = '1', limit = PAGE_SIZE.toString() } = req.query;
    const query = String(q || '').toLowerCase();

    if (!query) {
      res.status(400).json({ error: 'Search query required' });
      return;
    }

    const pageNum = Math.max(1, parseInt(String(page)) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(String(limit)) || PAGE_SIZE));

    const db = firebaseAdmin.firestore();
    const snapshot = await db.collection(COLLECTION).get();

    // Client-side filtering (Firestore doesn't support full-text search in free tier)
    const filtered = snapshot.docs
      .filter(doc => {
        const data = doc.data();
        const searchFields = [
          data.title?.toLowerCase() || '',
          data.description?.toLowerCase() || '',
          data.category?.toLowerCase() || '',
          data.location?.toLowerCase() || '',
        ].join(' ');

        return searchFields.includes(query);
      })
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

    const skip = (pageNum - 1) * pageSize;
    const results = filtered.slice(skip, skip + pageSize);
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pageSize);

    res.json({
      data: results,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total: totalCount,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
      query,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getTourismLocations(_req: Request, res: Response): Promise<void> {
  try {
    const db = firebaseAdmin.firestore();
    const snapshot = await db.collection(COLLECTION).get();

    const locations = new Set<string>();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.location) {
        locations.add(data.location);
      }
    });

    res.json({
      locations: Array.from(locations).sort(),
      count: locations.size,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getTourismCategories(_req: Request, res: Response): Promise<void> {
  try {
    const db = firebaseAdmin.firestore();
    const snapshot = await db.collection(COLLECTION).get();

    const categories = new Set<string>();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.category) {
        categories.add(data.category);
      }
    });

    res.json({
      categories: Array.from(categories).sort(),
      count: categories.size,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getTourismStats(_req: Request, res: Response): Promise<void> {
  try {
    const db = firebaseAdmin.firestore();
    const snapshot = await db.collection(COLLECTION).get();

    const stats = {
      totalActivities: snapshot.size,
      locations: new Set<string>(),
      categories: new Set<string>(),
      avgRating: 0,
      priceRange: { min: Infinity, max: 0 },
    };

    let totalRating = 0;
    let ratingCount = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.location) stats.locations.add(data.location);
      if (data.category) stats.categories.add(data.category);
      if (data.rating) {
        totalRating += data.rating;
        ratingCount++;
      }
      if (data.price) {
        stats.priceRange.min = Math.min(stats.priceRange.min, data.price);
        stats.priceRange.max = Math.max(stats.priceRange.max, data.price);
      }
    });

    res.json({
      totalActivities: stats.totalActivities,
      locations: Array.from(stats.locations),
      locationCount: stats.locations.size,
      categories: Array.from(stats.categories),
      categoryCount: stats.categories.size,
      avgRating: ratingCount > 0 ? (totalRating / ratingCount).toFixed(2) : 0,
      priceRange: {
        min: stats.priceRange.min === Infinity ? 0 : stats.priceRange.min,
        max: stats.priceRange.max,
      },
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}
