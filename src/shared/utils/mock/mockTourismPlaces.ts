import { faker } from "@faker-js/faker";
import type { TourismPlace } from "#app/modules/tourism_places/infrastructure/models/tourismPlace.model.js";

export function generateMockTourismPlace(): TourismPlace {
  return {
    _id: faker.string.uuid(),
    name: `${faker.location.city()} ${faker.word.noun()}`,
    desc: faker.lorem.paragraph(),
    loc: faker.location.city(),
    coords: {
      lat: Number(faker.location.latitude()),
      lng: Number(faker.location.longitude()),
    },
    cat: faker.helpers.arrayElement([
      "Museum",
      "Park",
      "Monument",
      "Beach",
      "Market",
      "Temple",
    ]),
    rating: faker.number.float({ min: 2, max: 5, fractionDigits: 1 }),
    price: faker.number.int({ min: 10, max: 200 }),
    addr: faker.location.streetAddress(),
    reviews: faker.number.int({ min: 0, max: 1000 }),
    open: faker.datatype.boolean(),
    hours: {
      open: faker.helpers.arrayElement(["08:00", "09:00", "10:00"]),
      close: faker.helpers.arrayElement(["16:00", "17:00", "18:00"]),
    },
    features: faker.helpers.arrayElements(
      [
        "Guided Tours",
        "Souvenir Shop",
        "Cafe",
        "Parking",
        "Audio Guide",
        "Wheelchair Accessible",
      ],
      { min: 1, max: 4 }
    ),
    img: faker.image.urlPicsumPhotos({ width: 640, height: 480 }),
    phone: faker.phone.number(),
    title: faker.company.name(), // Added required 'title' property
  };
}

export function generateMockTourismPlaces(count = 20): TourismPlace[] {
  return Array.from({ length: count }, generateMockTourismPlace);
}
