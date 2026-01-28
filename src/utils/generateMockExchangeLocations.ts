/**
 * Generates an array of mock exchange locations for testing and development.
 *
 * - Follows project documentation for mock data generation (see docs/ and kemet-mart patterns)
 * - Each location has unique id, realistic name, address, rating, open hours, and features
 * - Use in tests, local dev, or to seed a database
 *
 * @param count Number of locations to generate
 * @returns ExchangeLocation[]
 */
type ExchangeLocation = {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  rating: number;
  openHours: string;
  features: string[];
};

export function generateMockExchangeLocations(count: number = 10): ExchangeLocation[] {
  const featuresList = [
    ['No Commission', 'Fast Service', 'Online Booking'],
    ['VIP Lounge', 'Wheelchair Access', 'Free WiFi'],
    ['24/7 Service', 'Currency Delivery', 'Parking'],
    ['Multi-language Staff', 'ATM Nearby', 'Child Friendly'],
  ];

  const names = [
    'Cairo Exchange Center',
    'Giza Money Hub',
    'Alexandria Forex Point',
    'Luxor Currency House',
    'Sharm Exchange Plaza',
    'Aswan Money Market',
    'Hurghada Exchange',
    'Tanta Forex Center',
    'Mansoura Exchange',
    'Zagazig Money Spot',
  ];

  const locations: ExchangeLocation[] = [];
  for (let i = 0; i < count; i++) {
    const id = `exchange-center-${i + 1}`;
    const name = names[i % names.length];
    const address = `${100 + i} Main St, City ${i + 1}`;
    const distanceKm = +(Math.random() * 10).toFixed(2);
    const rating = +(3.5 + Math.random() * 1.5).toFixed(1);
    const openHours = Math.random() > 0.5 ? '24/7' : '9:00-21:00';
    const features = featuresList[i % featuresList.length];
    locations.push({
      id,
      name,
      address,
      distanceKm,
      rating,
      openHours,
      features,
    });
  }
  return locations;
}

// If run directly, print JSON to stdout (for dev/test seeding)
if (require.main === module) {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(generateMockExchangeLocations(10), null, 2));
}
