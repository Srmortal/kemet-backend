import { faker } from '@faker-js/faker';

export function generateMockTourPackages(count: number) {
  const categories = ['adventure', 'safari', 'cultural', 'relaxation'];
  return Array.from({ length: count }, (_, i) => ({
    id: (i + 1).toString(),
    name: faker.company.catchPhrase(),
    image: faker.image.urlPicsumPhotos({ width: 400, height: 300 }),
    pricePerPerson: faker.number.int({ min: 50, max: 500 }),
    discount: faker.datatype.boolean() ? faker.number.int({ min: 5, max: 30 }) : undefined,
    rating: faker.number.float({ min: 3, max: 5, fractionDigits: 1 }),
    location: faker.location.city(),
    availableLanguages: faker.helpers.arrayElements(['en', 'ar', 'fr', 'de'], faker.number.int({ min: 1, max: 3 })),
    included: faker.helpers.arrayElements(['Guide', 'Meals', 'Transport', 'Tickets'], faker.number.int({ min: 1, max: 4 })),
    itinerary: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, (_, d) => `Day ${d + 1}: ${faker.location.city()}`),
    duration: `${faker.number.int({ min: 1, max: 7 })} days`,
    groupSize: { min: faker.number.int({ min: 1, max: 5 }), max: faker.number.int({ min: 6, max: 20 }) },
    category: faker.helpers.arrayElement(categories),
  }));
}
