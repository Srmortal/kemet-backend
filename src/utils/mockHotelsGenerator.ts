import { faker } from '@faker-js/faker';
import { Hotel } from '@models/hotel.model';
import { Room } from '@models/room.model';

// --- Constants for Egyptian Context ---

const EGYPTIAN_LOCATIONS = [
  { city: 'Cairo', gov: 'Cairo' },
  { city: 'Giza', gov: 'Giza' },
  { city: 'Alexandria', gov: 'Alexandria' },
  { city: 'Sharm El Sheikh', gov: 'South Sinai' },
  { city: 'Hurghada', gov: 'Red Sea' },
  { city: 'Luxor', gov: 'Luxor' },
  { city: 'Aswan', gov: 'Aswan' },
  { city: 'Dahab', gov: 'South Sinai' },
  { city: 'Marsa Alam', gov: 'Red Sea' },
];

const HOTEL_SUFFIXES = ['Plaza', 'Resort', 'Hotel', 'Palace', 'Suites', 'Inn'];

// --- Generator Functions ---

/**
 * Generates a single deterministic hotel based on an integer ID.
 */
export const getHotelById = (id: number): Hotel => {
  // 1. Seed Faker deterministically with the ID
  faker.seed(id);

  // 2. Pick location
  const location = faker.helpers.arrayElement(EGYPTIAN_LOCATIONS);

  // 3. Generate meaningful name
  const adjective = faker.word.adjective();
  const suffix = faker.helpers.arrayElement(HOTEL_SUFFIXES);
  // Example: "Fantastic Cairo Plaza"
  const name = `${capitalize(adjective)} ${location.city} ${suffix}`;

  // 4. Generate ratings
  const stars = faker.helpers.arrayElement([3, 4, 5]) as 3 | 4 | 5;
  // Weighted rating: favored towards 3.5 - 5.0 for realism
  const rating = faker.number.float({ min: 3.5, max: 5.0, fractionDigits: 1 });
  const reviewsCount = faker.number.int({ min: 50, max: 2500 });

  return {
    id,
    name,
    governorate: location.gov,
    city: location.city,
    stars,
    rating,
    reviewsCount,
    currency: 'EGP',
    thumbnail: faker.image.url()
  };
};

/**
 * Generates a list of hotels given a count and start ID.
 * Useful for pagination (e.g., page 2 starts at id 21).
 */
export const generateHotels = (count: number, startId = 1): Hotel[] => {
  const hotels: Hotel[] = [];
  for (let i = 0; i < count; i++) {
    hotels.push(getHotelById(startId + i));
  }
  return hotels;
};

/**
 * Generates deterministic rooms for a specific hotel.
 * The room IDs are derived from the Hotel ID to ensure global uniqueness potential.
 */
export const getRoomsForHotel = (hotelId: number): Room[] => {
  // Seed hash: hotelId * 9999 ensures room generation doesn't clash with hotel generation seeds
  const seedBase = hotelId * 9999;
  faker.seed(seedBase);

  const numRooms = faker.number.int({ min: 5, max: 10 });
  const rooms: Room[] = [];

  for (let i = 1; i < numRooms + 1; i++) {
    // Unique seed for each room iteration
    faker.seed(seedBase + i);

    const type = faker.helpers.arrayElement([
      'Standard Room',
      'Deluxe Room',
      'Executive Suite',
      'Royal Suite',
    ]);

    // Pricing logic based on room type
    let basePrice = 0;
    let capacity = 2;
    switch (type) {
      case 'Standard Room': basePrice = 800; capacity = 2; break;
      case 'Deluxe Room': basePrice = 1500; capacity = 2; break;
      case 'Executive Suite': basePrice = 3500; capacity = 3; break;
      case 'Royal Suite': basePrice = 7000; capacity = 4; break;
    }

    // Add variance to price so not every Standard Room costs exactly 800
    const priceVariance = faker.number.int({ min: -100, max: 200 });
    const finalPrice = Math.max(100, (basePrice + priceVariance));

    // Round to nearest 50 EGP for aesthetics
    const roundedPrice = Math.ceil(finalPrice / 50) * 50;

    // Generate unique ID for room (e.g., Hotel 50 -> Room 5001, 5002)
    // This allows frontend to assume ID structure without DB
    const roomId = parseInt(`${hotelId}${i.toString().padStart(2, '0')}`);

    rooms.push({
      id: roomId,
      hotelId,
      name: type as Room['name'],
      capacity,
      pricePerNight: roundedPrice,
      currency: 'EGP',
      amenities: {
        wifi: true, // Always true in 2024+
        ac: faker.datatype.boolean(0.9), // 90% chance
        tv: faker.datatype.boolean(0.8),
        balcony: type.includes('Suite') ? true : faker.datatype.boolean(),
      },
    });
  }

  return rooms.sort((a, b) => a.pricePerNight - b.pricePerNight);
};

// Helper
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
