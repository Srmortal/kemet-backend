/**
 * Deterministic Fake Rating Generator for Tourism Places
 * 
 * Generates fake ratings (out of 5.0) at runtime for testing and UI display.
 * Ratings are deterministic based on (governorate + place name).
 */

import { faker } from '@faker-js/faker';

/**
 * Creates a deterministic numeric seed from a string
 */
function createSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generates a deterministic fake rating for a tourism place
 * 
 * @param governorate - The governorate/city name
 * @param placeTitle - The title of the tourism place
 * @returns A rating number between 3.5 and 5.0 (1 decimal place)
 * 
 * @example
 * ```typescript
 * const rating = generateTourismRating('alexandria', 'Citadel of Qaitbay');
 * // Returns: 4.7
 * ```
 */
export function generateTourismRating(
  governorate: string,
  placeTitle: string
): number {
  // Create deterministic seed from governorate + place title + 'rating' suffix
  // Suffix ensures the seed is different from the price seed for the same place
  const seedString = `${governorate.toLowerCase()}-${placeTitle.toLowerCase()}-rating`;
  const seed = createSeed(seedString);

  // Create a seeded Faker instance
  faker.seed(seed);

  // Generate rating between 3.5 and 5.0
  // We bias towards higher ratings for tourism demos
  return faker.number.float({ min: 3.5, max: 5.0, fractionDigits: 1 });
}

/**
 * Check if mock rating generation should be enabled
 */
export function isRatingEnabled(): boolean {
  const env = process.env['NODE_ENV'] || 'development';
  // Allow explicit disable via env var, otherwise default to true in dev/test
  const enableRating = process.env['ENABLE_FAKE_RATING'] !== 'false';
  
  return (env === 'development' || env === 'test') && enableRating;
}

/**
 * Conditionally adds ratings to places if they don't have one
 */
export function conditionallyAddRatings<T extends { title: string; rating?: number }>(
  governorate: string,
  places: T[]
): (T & { rating: number })[] {
  if (!isRatingEnabled()) {
    // Return objects as-is, asserting they have the type (or might remain undefined if logic allows)
    // But usually we want to fill gaps.
    return places as (T & { rating: number })[];
  }

  return places.map(place => {
    // If it already has a real rating from DB, keep it. Otherwise, generate one.
    const rating = place.rating ?? generateTourismRating(governorate, place.title);
    
    return {
      ...place,
      rating
    };
  });
}