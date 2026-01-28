/**
 * Deterministic Fake Price Generator for Tourism Places
 * 
 * Generates fake prices at runtime for testing and UI display.
 * Prices are deterministic based on (governorate + place name) using seeded Faker.
 */

import { faker } from '@faker-js/faker';

/**
 * Price structure for foreign tourists
 */
export interface TourismPrice {
  currency: 'EGP';
  foreigner: number;
}

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
 * Generates a deterministic fake price for a tourism place
 * 
 * @param governorate - The governorate/city name (e.g., "alexandria", "cairo")
 * @param placeTitle - The title of the tourism place
 * @returns A price object with currency and foreigner price
 * 
 * @example
 * ```typescript
 * const price = generateTourismPrice('alexandria', 'Citadel of Qaitbay');
 * // Returns: { currency: 'USD', foreigner: 35 }
 * // Will always return the same price for the same inputs
 * ```
 */
export function generateTourismPrice(
  governorate: string,
  placeTitle: string
): TourismPrice {
  // Create deterministic seed from governorate + place title
  const seedString = `${governorate.toLowerCase()}-${placeTitle.toLowerCase()}`;
  const seed = createSeed(seedString);

  // Create a seeded Faker instance
  faker.seed(seed);

  // Generate price between 100-800 EGP (Realistic range for entry tickets in Egypt)
  const rawPrice = faker.number.float({ min: 100, max: 800, fractionDigits: 2 });

  // Round to nearest 10 EGP for cleaner pricing (e.g., 150, 320 instead of 321)
  const foreigner = Math.ceil(rawPrice / 10) * 10;

  return {
    currency: 'EGP',
    foreigner,
  };
}

/**
 * Batch generates prices for multiple places
 * 
 * @param governorate - The governorate name
 * @param places - Array of place objects with 'title' property
 * @returns Array of places with added 'price' property
 */
export function generatePricesForPlaces<T extends { title: string }>(
  governorate: string,
  places: T[]
): (T & { price: TourismPrice })[] {
  return places.map(place => ({
    ...place,
    price: generateTourismPrice(governorate, place.title),
  }));
}

/**
 * Check if pricing generation should be enabled based on environment
 */
export function isPricingEnabled(): boolean {
  const env = process.env['NODE_ENV'] || 'development';
  const enablePricing = process.env['ENABLE_FAKE_PRICING'] !== 'false';
  
  return (env === 'development' || env === 'test') && enablePricing;
}

/**
 * Conditionally adds pricing to places based on environment
 */
export function conditionallyAddPrices<T extends { title: string }>(
  governorate: string,
  places: T[]
): (T & { price?: TourismPrice })[] {
  if (!isPricingEnabled()) {
    return places;
  }

  return generatePricesForPlaces(governorate, places);
}
