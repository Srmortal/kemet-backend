import { faker } from '@faker-js/faker';

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  currency: 'EGP';
  rating: number;
  image: string;
  isBestseller?: boolean;
  isPremium?: boolean;
  discountPercent?: number;
  oldPrice?: number;
}

const PRODUCT_CATEGORIES = ['Souvenirs', 'Clothing', 'Art'];

export function generateProductById(id: number): Product {
  faker.seed(id);
  const category = faker.helpers.arrayElement(PRODUCT_CATEGORIES);
  const name = faker.commerce.productName();
  const price = faker.number.float({ min: 30, max: 200, fractionDigits: 2 });
  const rating = faker.number.float({ min: 4.5, max: 5.0, fractionDigits: 1 });
  const isBestseller = faker.datatype.boolean(0.3);
  const isPremium = faker.datatype.boolean(0.1);
  const discountPercent = faker.datatype.boolean(0.2) ? faker.number.int({ min: 10, max: 40 }) : undefined;
  const oldPrice = discountPercent ? Math.round(price / (1 - discountPercent / 100)) : undefined;

  return {
    id,
    name,
    category,
    price,
    currency: 'EGP',
    rating,
    image: faker.image.url(),
    isBestseller,
    isPremium,
    discountPercent,
    oldPrice,
  };
}

export function generateProducts(count: number, startId = 1): Product[] {
  return Array.from({ length: count }, (_, i) => generateProductById(startId + i));
}