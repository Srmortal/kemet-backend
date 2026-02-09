import { FirestoreOrm } from '@infrastructure/firestore/firestoreOrm';

import { generateTourismPrice, isPricingEnabled } from '@utils/priceGenerator';
import { generateTourismRating, isRatingEnabled } from '@utils/ratingGenerator';
import type { TourismPlace, TourismRepository as TourismRepositoryPort } from '../ports/tourism-repository';

const COLLECTION = 'tourism_sites';
const tourismOrm = new FirestoreOrm<TourismPlace>(COLLECTION);

export class TourismRepository implements TourismRepositoryPort {
  /**
   * Build Firestore sort query for tourism places
   */
  buildSort(query: FirebaseFirestore.Query, sortBy?: string) {
    const sortMap: Record<string, string> = {
      rating: 'rating',
      '-rating': 'rating',
      price: 'price',
      '-price': 'price',
      title: 'title',
      '-title': 'title',
      date: 'createdAt',
      '-date': 'createdAt'
    };
    const sortField = sortMap[String(sortBy)] || 'createdAt';
    const isDescending = String(sortBy).startsWith('-');
    return isDescending ? query.orderBy(sortField, 'desc') : query.orderBy(sortField, 'asc');
  }
  queryBuilder() {
    return tourismOrm.queryBuilder();
  }

  async getById(id: string) {
    return tourismOrm.getById(id);
  }

  async getAll() {
    return tourismOrm.getAll();
  }

  /**
   * Adds mock price and rating to a tourism place for display purposes
   */
  enrichPlaceData(place: TourismPlace): TourismPlace {
    let governorateSeed = place.governorate;
    if (!governorateSeed && typeof place.location === 'string') {
      governorateSeed = place.location;
    }
    const finalGov = governorateSeed || 'egypt';
    const finalTitle = place.title || 'unknown place';
    const enrichedPlace = { ...place };
    if (isPricingEnabled()) {
      enrichedPlace.price = generateTourismPrice(finalGov, finalTitle).foreigner;
    }
    if (isRatingEnabled() && enrichedPlace.rating === undefined) {
      enrichedPlace.rating = generateTourismRating(finalGov, finalTitle);
    }
    return enrichedPlace;
  }

  async getPlacesWithFilters(params: {
    location?: string;
    category?: string;
    sortBy?: string;
    pageNum: number;
    pageSize: number;
  }): Promise<{ places: TourismPlace[]; totalCount: number }> {
    let query: FirebaseFirestore.Query = this.queryBuilder();
    if (params.location) query = query.where('governorate', '==', String(params.location));
    if (params.category) query = query.where('category', '==', String(params.category));
    query = this.buildSort(query, params.sortBy);

    const countSnapshot = await query.count().get();
    const totalCount = countSnapshot.data().count;

    const skip = (params.pageNum - 1) * params.pageSize;
    const snapshot = await query.offset(skip).limit(params.pageSize).get();

    const places = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as TourismPlace))
      .map(place => this.enrichPlaceData(place));

    return { places, totalCount };
  }
}

export const tourismRepository = new TourismRepository();
