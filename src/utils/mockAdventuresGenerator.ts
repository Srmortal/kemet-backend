import { Adventure } from '../models/adventures.model';
import { faker } from '@faker-js/faker';


const DIFFICULTIES: Adventure['difficulty'][] = ['Beginner', 'Moderate', 'Advanced'];
const CATEGORIES = ['Adventure', 'Water Sports', 'Cultural', 'Nature', 'Extreme'];
const LOCATIONS = ['Western Desert', 'Hurghada', 'Luxor', 'Aswan', 'Sinai', 'Cairo', 'Alexandria'];
const HIGHLIGHTS = [
  '4x4 dune bashing',
  'Sandboarding',
  'Camel ride',
  'Bedouin dinner',
  'Sunset views',
  'Snorkeling',
  'Scuba diving',
  'Hot air balloon',
  'Quad biking',
  'Guided tour',
  'Local cuisine',
];
const INCLUDED = ['Transportation', 'Guide', 'Dinner', 'Equipment', 'Snacks', 'Drinks'];
const LANGUAGES = ['English', 'Arabic', 'French', 'German', 'Italian', 'Spanish'];

export function generateAdventures(count = 10): Adventure[] {
  return Array.from({ length: count }).map((_, i) => {
    const difficulty = faker.helpers.arrayElement(DIFFICULTIES);
    const category = faker.helpers.arrayElement(CATEGORIES);
    const location = faker.helpers.arrayElement(LOCATIONS);
    const highlights = faker.helpers.arrayElements(HIGHLIGHTS, faker.number.int({ min: 3, max: 5 }));
    const included = faker.helpers.arrayElements(INCLUDED, faker.number.int({ min: 2, max: 4 }));
    const languages = faker.helpers.arrayElements(LANGUAGES, faker.number.int({ min: 1, max: 2 }));
    const tags = highlights.map(h => h.split(' ')[0].toLowerCase());
    return {
      id: `adventure-${i + 1}`,
      title: faker.company.catchPhrase() + ' Adventure',
      description: faker.lorem.sentence() + ' ' + faker.lorem.sentences(2),
      category,
      price: faker.number.int({ min: 80, max: 500 }),
      currency: 'EGP',
      rating: Number(faker.number.float({ min: 0, max: 5, fractionDigits: 1 })),
      reviewCount: faker.number.int({ min: 10, max: 2000 }),
      duration: `${faker.number.int({ min: 2, max: 10 })} hours`,
      location,
      maxParticipants: faker.number.int({ min: 6, max: 30 }),
      difficulty,
      highlights,
      included,
      languages,
      tags,
      thumbnail: faker.image.urlPicsumPhotos({ width: 200, height: 200 }),
    };
  });
}


export function getAdventureById(id: string): Adventure {
  // For deterministic results, always generate the same set
  return adventuresMock.find(a => a.id === id)!;
}

export const adventuresMock = generateAdventures(20);
