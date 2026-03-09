// utils/generateMockGuides.ts
import { faker } from "@faker-js/faker";

function randomFrom<T>(arr: T[], count: number) {
  return faker.helpers.arrayElements(arr, count);
}

const CREDENTIALS = [
  "Licensed Egyptologist",
  "PhD",
  "UNESCO Certified",
  "First Aid Certified",
  "Adventure Specialist",
  "Certified Diver",
  "Desert Expert",
];
const LANGUAGES = [
  "English",
  "Arabic",
  "French",
  "German",
  "Russian",
  "Spanish",
  "Italian",
];
const SPECIALIZATIONS = [
  "Egyptology",
  "Ancient History",
  "Museums",
  "Desert Safari",
  "Adventure Tours",
  "Diving",
];

function generateTour() {
  return {
    name: faker.company.catchPhrase(),
    description: faker.lorem.sentence(),
    durationHours: faker.number.int({ min: 2, max: 12 }),
    maxPeople: faker.number.int({ min: 4, max: 20 }),
    price: faker.number.int({ min: 500, max: 3000 }),
  };
}

function generateGuide(id: number) {
  const featured = faker.datatype.boolean();
  return {
    id: id.toString(),
    name: `${faker.person.firstName()} ${faker.person.lastName()}`,
    featured,
    rating: Number(faker.number.float({ min: 4.5, max: 5, fractionDigits: 1 })),
    reviews: faker.number.int({ min: 50, max: 1000 }),
    toursCount: faker.number.int({ min: 100, max: 2000 }),
    pricePerDay: faker.number.int({ min: 500, max: 2000 }),
    pricePerHour: faker.number.int({ min: 50, max: 300 }),
    credentials: randomFrom(CREDENTIALS, faker.number.int({ min: 1, max: 4 })),
    languages: randomFrom(LANGUAGES, faker.number.int({ min: 1, max: 4 })),
    specializations: randomFrom(
      SPECIALIZATIONS,
      faker.number.int({ min: 1, max: 3 })
    ),
    about: faker.lorem.paragraph(),
    tours: Array.from(
      { length: faker.number.int({ min: 1, max: 3 }) },
      generateTour
    ),
  };
}

export function generateMockGuides(count = 10) {
  return Array.from({ length: count }, (_, i) => generateGuide(i + 1));
}

export const mockGuides = generateMockGuides(15);
