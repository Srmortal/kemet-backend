// // Declare mocks FIRST
// const mockRunTransaction = jest.fn();
// const mockGetById = jest.fn();

// // Mock FirestoreOrm BEFORE any imports
// jest.mock('@utils/firestoreOrm', () => {
//   const actual = jest.requireActual('@utils/firestoreOrm');
//   return {
//     ...actual,
//     FirestoreOrm: {
//       fromModel: jest.fn(() => ({
//         runTransaction: mockRunTransaction,
//         getById: mockGetById,
//       })),
//     },
//   };
// });

// // Now import everything else
// import { KemetMartService } from '../src/services/kemetMart.service';
// import { ok, err } from '../src/types/result.types';
// import { Cart } from '../src/models/cart.model';

// describe('KemetMartService', () => {
//   const service = new KemetMartService();
//   const userId = 'user1';
//   const productId = '123';

//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should increment cart item quantity', async () => {
//     const cart = {
//       userId,
//       items: [{ productId }],
//       updatedAt: new Date(),
//     };

//     mockRunTransaction.mockImplementation(async (_userId, callback) => {
//       const transaction = { update: jest.fn() };
//       const cartCopy = {
//         ...cart,
//         items: cart.items.map(item => ({ ...item })),
//       };
//       const result = await callback(cartCopy, {}, transaction);
//       return result;
//     });

//     const result = await service.incrementCartItem(userId, productId);
//     expect(result.ok).toBe(true);
//     if (result.ok) {
//       expect(result.value.items[0].productId).toBe(productId);
//       expect(typeof result.value.total).toBe('number');
//       // Optionally: expect(result.value.total).not.toBeNaN();
//     } else {
//       throw new Error('Expected ok result, got error: ' + (result.error?.message || result.error));
//     }
//   });

//   it('should error if product not in cart', async () => {
//     const cart = {
//       userId,
//       items: [],
//       updatedAt: new Date(),
//     };

//     mockRunTransaction.mockImplementation(async (_userId, callback) => {
//       return callback(cart, {}, { update: jest.fn() });
//     });

//     let result;
//     try {
//       result = await service.incrementCartItem(userId, productId);
//     } catch (e) {
//       result = err(e instanceof Error ? e : new Error(String(e)));
//     }
//     expect(result.ok).toBe(false);
//     if (!result.ok) {
//       expect(result.error).toMatchObject({ type: 'NotFound' });
//       expect(result.error.message).toMatch(/Product not in cart/);
//     } else {
//       expect(result.ok).toBe(false);
//     }
//   });

//   it('should error if cart is missing', async () => {
//     mockRunTransaction.mockImplementation(async (_userId, callback) => {
//       return callback(undefined, {}, { update: jest.fn() });
//     });

//     let result;
//     try {
//       result = await service.incrementCartItem(userId, productId);
//     } catch (e) {
//       result = err(e instanceof Error ? e : new Error(String(e)));
//     }
//     expect(result.ok).toBe(false);
//     if (!result.ok) {
//       expect(result.error).toMatchObject({ type: 'NotFound' });
//       expect(result.error.message).toMatch(/Cart not found or invalid/);
//     } else {
//       expect(result.ok).toBe(false);
//     }
//   });
//   it('should add item to cart and then increment quantity', async () => {
//     // Initial cart is empty
//     let cart: any = {
//       userId,
//       items: [],
//       updatedAt: new Date(),
//     };

//     // Mock addToCart transaction: returns empty cart so product can be added
//     mockRunTransaction.mockImplementationOnce(async (_userId, callback) => {
//       const transaction = { update: jest.fn() };
//       // Simulate addToCart: cart is empty before adding
//       return await callback({ ...cart }, {}, transaction);
//     });

//     // Simulate addToCart
//     const addResult = await service.addToCart(userId, productId);
//     expect(addResult.ok).toBe(true);
//     if (addResult.ok) {
//       expect(addResult.value.items[0].productId).toBe(productId);
//     }

//     // Now increment: mock should return cart with item present
//     mockRunTransaction.mockImplementationOnce(async (_userId, callback) => {
//       const transaction = { update: jest.fn() };
//       // Simulate increment logic: item is present
//       cart = {
//         ...cart,
//         items: [{ productId }],
//         updatedAt: new Date(),
//       };
//       return await callback(cart, {}, transaction);
//     });

//     const result = await service.incrementCartItem(userId, productId);
//     expect(result.ok).toBe(true);
//     if (result.ok) {
//       expect(result.value.items[0].productId).toBe(productId);
//       expect(typeof result.value.total).toBe('number');
//     } else {
//       throw new Error('Expected ok result, got error: ' + (result.error?.message || result.error));
//     }
//   });
// });
