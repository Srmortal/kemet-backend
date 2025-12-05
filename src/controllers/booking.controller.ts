import { Request, Response } from 'express';
import { firebaseAdmin } from '@config/firebase';

const COLLECTION = 'booking_accommodations_egypt';
const PAGE_SIZE = 20;

export async function getAccommodations(req: Request, res: Response) {
  try {
    const { location, type, minPrice, maxPrice, page = '1', limit = PAGE_SIZE.toString(), sortBy = 'rating' } = req.query;
    const pageNum = Math.max(1, parseInt(String(page)) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(String(limit)) || PAGE_SIZE));

    const db = firebaseAdmin.firestore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = db.collection(COLLECTION);

    // Apply filters
    if (location) {
      query = query.where('location', '==', String(location));
    }

    if (type) {
      query = query.where('type', '==', String(type));
    }

    // Price range filtering
    if (minPrice) {
      const min = parseFloat(String(minPrice)) || 0;
      query = query.where('pricePerNight', '>=', min);
    }

    if (maxPrice) {
      const max = parseFloat(String(maxPrice)) || 10000;
      query = query.where('pricePerNight', '<=', max);
    }

    // Apply sorting
    const sortMap: Record<string, string> = {
      'rating': 'rating',
      '-rating': 'rating',
      'price': 'pricePerNight',
      '-price': 'pricePerNight',
      'name': 'name',
      '-name': 'name',
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
    const accommodations = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const totalPages = Math.ceil(totalCount / pageSize);

    res.json({
      data: accommodations,
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
        type: type || null,
        priceRange: {
          min: minPrice || null,
          max: maxPrice || null,
        },
        sortBy,
      },
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getAccommodationById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const db = firebaseAdmin.firestore();
    const doc = await db.collection(COLLECTION).doc(id).get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Accommodation not found' });
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

export async function searchAccommodations(req: Request, res: Response): Promise<void> {
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

    // Client-side filtering
    const filtered = snapshot.docs
      .filter(doc => {
        const data = doc.data();
        const searchFields = [
          data.name?.toLowerCase() || '',
          data.description?.toLowerCase() || '',
          data.location?.toLowerCase() || '',
          data.address?.toLowerCase() || '',
          data.type?.toLowerCase() || '',
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

export async function getAccommodationLocations(_req: Request, res: Response): Promise<void> {
  try {
    const db = firebaseAdmin.firestore();
    const snapshot = await db.collection(COLLECTION).get();

    const locations = new Map<string, number>();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.location) {
        locations.set(data.location, (locations.get(data.location) || 0) + 1);
      }
    });

    const locationList = Array.from(locations.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      locations: locationList,
      count: locations.size,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getAccommodationTypes(_req: Request, res: Response): Promise<void> {
  try {
    const db = firebaseAdmin.firestore();
    const snapshot = await db.collection(COLLECTION).get();

    const types = new Map<string, number>();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.type) {
        types.set(data.type, (types.get(data.type) || 0) + 1);
      }
    });

    const typeList = Array.from(types.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      types: typeList,
      count: types.size,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getAccommodationStats(_req: Request, res: Response): Promise<void> {
  try {
    const db = firebaseAdmin.firestore();
    const snapshot = await db.collection(COLLECTION).get();

    const stats = {
      totalAccommodations: snapshot.size,
      locations: new Map<string, number>(),
      types: new Map<string, number>(),
      avgRating: 0,
      priceRange: { min: Infinity, max: 0 },
    };

    let totalRating = 0;
    let ratingCount = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.location) {
        stats.locations.set(data.location, (stats.locations.get(data.location) || 0) + 1);
      }
      if (data.type) {
        stats.types.set(data.type, (stats.types.get(data.type) || 0) + 1);
      }
      if (data.rating) {
        totalRating += data.rating;
        ratingCount++;
      }
      if (data.pricePerNight) {
        stats.priceRange.min = Math.min(stats.priceRange.min, data.pricePerNight);
        stats.priceRange.max = Math.max(stats.priceRange.max, data.pricePerNight);
      }
    });

    res.json({
      totalAccommodations: stats.totalAccommodations,
      locationStats: Array.from(stats.locations.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      locationCount: stats.locations.size,
      typeStats: Array.from(stats.types.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      typeCount: stats.types.size,
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
