// import { ok, err, Result } from '../types/result.types';
// import type { DomainError } from '../types/domain-error.type';
// import { generateProducts, generateProductById } from '@utils/mockProductsGenerator';
// // DTOs removed; use plain object shapes or OpenAPI types if available
// import { Cart, CartItem } from '../models/cart.model';
// import { Checkout } from '../models/checkout.model';
// import logger from '@utils/logger';
// import { FirestoreOrm } from 'infrastructure/firestore/firestoreOrm';

// const cartOrm = FirestoreOrm.fromModel(Cart);
// const checkoutOrm = FirestoreOrm.fromModel(Checkout);

// export class KemetMartService {

//   async getProducts(page: number = 1, limit: number = 20): Promise<Result<{ data: Array<{ productId: string; name: string; price: number; }>; pagination: { page: number; limit: number; hasNext: boolean; hasPrev: boolean; } }, DomainError>> {
//     try {
//       const pageNum = Math.max(1, page);
//       const limitNum = Math.max(1, limit);
//       const startId = (pageNum - 1) * limitNum + 1;
//         const products = generateProducts(limitNum, startId).map((p) => ({
//           productId: String(p.id),
//           name: p.name,
//           price: p.price,
//         }));
//       const pagination = {
//         page: pageNum,
//         limit: limitNum,
//         hasNext: products.length === limitNum,
//         hasPrev: pageNum > 1,
//       };
//       return ok({ data: products, pagination });
//     } catch (error) {
//       return err({ type: 'Unknown', message: 'Unknown error' });
//     }
//   }

//   async getCart(userId: string): Promise<Result<{ items: CartItem[]; total: number }, DomainError>> {
//     try {
//       const cart = await cartOrm.getById(userId);
//       const items = (cart && cart.items) ? cart.items : [];
//       const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
//       return ok({ items, total });
//     } catch (error) {
//       return err({ type: 'Unknown', message: 'Failed to fetch cart' });
//     }
//   }


//   /**
//    * Add a new product to cart (quantity = 1, or error if exists)
//    */
//   async addToCart(userId: string, productId: number): Promise<Result<{ items: CartItem[]; total: number }, DomainError>> {
//     try {
//       let conflict = false;
//       let conflictMsg = '';
//       const result = await cartOrm.runTransaction<{ items: CartItem[]; total: number }>(userId, async (cart, docRef, transaction) => {
//         const items: CartItem[] = cart && cart.items ? [...cart.items] : [];
//         const existing = items.find(i => String(i.productId) === String(productId));
//         if (existing) {
//           conflict = true;
//           conflictMsg = 'Product already in cart. Use increment endpoint.';
//           return { items, total: items.reduce((sum, item) => sum + item.quantity * item.price, 0) };
//         }
//         const product = generateProductById(productId);
//         if (!cart) {
//           // Document does not exist, create it
//           const items = [{ productId: String(productId), quantity: 1, price: product.price }];
//           await transaction.set(docRef, { items, updatedAt: new Date() });
//           const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
//           return { items, total };
//         } else {
//           // Document exists, update as usual
//           const items: CartItem[] = cart.items ? [...cart.items] : [];
//           items.push({ productId: String(productId), quantity: 1, price: product.price });
//           await transaction.update(docRef, { items, updatedAt: new Date() });
//           const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
//           return { items, total };
//         }
//       });
//       if (conflict) {
//         return err({ type: 'Conflict', message: conflictMsg });
//       }
//       return ok(result);
//     } catch (error) {
//       logger.error('[addToCart] Firestore transaction error', { userId, productId, error });
//       return err({ type: 'Unknown', message: 'Failed to add to cart' });
//     }
//   }

//   /**
//    * Increment quantity of a product in cart
//    */
//   async incrementCartItem(userId: string, productId: string): Promise<Result<{ items: CartItem[]; total: number }, DomainError>> {
//     try {
//       let notFound = false;
//       let notFoundMsg = '';
//       const result = await cartOrm.runTransaction<{ items: CartItem[]; total: number }>(
//         userId,
//         async (cart, docRef, transaction) => {
//           if (!cart || !Array.isArray(cart.items)) {
//             notFound = true;
//             notFoundMsg = 'Cart not found or invalid';
//             return { items: [], total: 0 };
//           }
//           const items: CartItem[] = [...cart.items];
//           // Ensure type match for productId
//           const existing = items.find(i => i.productId === productId);
//           if (!existing) {
//             notFound = true;
//             notFoundMsg = 'Product not in cart. Use add endpoint.';
//             return { items, total: items.reduce((sum, item) => sum + item.quantity * item.price, 0) };
//           }
//           existing.quantity++;
//           await transaction.update(docRef, { items, updatedAt: new Date() });
//           const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
//           return { items, total };
//         }
//       );
//       if (notFound) {
//         return err({ type: 'NotFound', message: notFoundMsg });
//       }
//       return ok(result);
//     } catch (error) {
//       logger.error('[incrementCartItem] Firestore transaction error', { userId, productId, error });
//       return err({ type: 'Unknown', message: 'Failed to increment cart item' });
//     }
//   }

//   /**
//    * Decrement quantity of a product in cart (removes if quantity reaches 0)
//    */
//   async decrementCartItem(userId: string, productId: string): Promise<Result<{ items: CartItem[]; total: number }, DomainError>> {
//     try {
//       let notFound = false;
//       let notFoundMsg = '';
//       const result = await cartOrm.runTransaction<{ items: CartItem[]; total: number }>(userId,async (cart, docRef, transaction) => {
//         const items: CartItem[] = cart && cart.items ? [...cart.items] : [];
//         const idx = items.findIndex(i => i.productId === productId);
//         if (idx === -1) {
//           notFound = true;
//           notFoundMsg = 'Product not in cart.';
//           return { items, total: items.reduce((sum, item) => sum + item.quantity * item.price, 0) };
//         }
//         if (items[idx].quantity > 1) {
//           items[idx].quantity--;
//         } else {
//           items.splice(idx, 1);
//         }
//         await transaction.update(docRef, { items, updatedAt: new Date() });
//         const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
//         return { items, total };
//       });
//       if (notFound) {
//         return err({ type: 'NotFound', message: notFoundMsg });
//       }
//       return ok(result);
//     } catch (error) {
//       logger.error('[decrementCartItem] Firestore transaction error', { userId, productId, error });
//       return err({ type: 'Unknown', message: 'Failed to decrement cart item' });
//     }
//   }

//   /**
//    * Remove a product from cart regardless of quantity
//    */
//   async removeFromCart(userId: string, productId: string): Promise<Result<{ items: CartItem[]; total: number }, DomainError>> {
//     try {
//       const result = await cartOrm.runTransaction<{ items: CartItem[]; total: number }>(userId,async (cart, docRef, transaction) => {
//         const items: CartItem[] = cart && cart.items ? [...cart.items] : [];
//         const idx = items.findIndex(i => i.productId === productId);
//         if (idx === -1) {
//           const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
//           return { items, total };
//         }
//         items.splice(idx, 1);
//         await transaction.update(docRef, { items, updatedAt: new Date() });
//         const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
//         return { items, total };
//       });
//       return ok(result);
//     } catch (error) {
//       logger.error('[removeFromCart] Firestore transaction error', { userId, productId, error });
//       return err({ type: 'Unknown', message: 'Failed to remove from cart' });
//     }
//   }

//   /**
//    * Helper to create an empty cart for a user (call at user creation)
//    */
//   static async createEmptyCartForUser(userId: string): Promise<void> {
//     await cartOrm.create({ userId, items: [], updatedAt: new Date() });
//   }

//   async checkout(userId: string): Promise<Result<{ orderId: string; total: number }, DomainError>> {
//     if (!userId) {
//       logger.error('[checkout] No userId provided', { userId });
//       return err({ type: 'NotFound', message: 'User not found' });
//     }
//     try {
//       let validationError = false;
//       let validationMsg = '';
//       const result = await cartOrm.runTransaction<{ orderId: string; total: number }>(userId,async (cart, docRef, transaction) => {
//         if (!cart || !(cart.items && cart.items.length)) {
//           logger.warn('[checkout] Cart is empty or doc does not exist', { userId });
//           validationError = true;
//           validationMsg = 'Cart is empty';
//           return { orderId: '', total: 0 };
//         }
//         const total = cart.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
//         if (total === 0) {
//           logger.warn('[checkout] Cart total is zero', { userId, cart });
//           validationError = true;
//           validationMsg = 'Cart is empty';
//           return { orderId: '', total: 0 };
//         }
//         const orderId = Math.random().toString(36).slice(2, 10);
//         const checkoutDoc: Checkout = {
//           id: '',
//           orderId,
//           userId,
//           items: cart.items,
//           total,
//           createdAt: new Date(),
//           status: 'completed',
//           paymentStatus: 'pending',
//           paymentMethod: 'cash',
//         };
//         await checkoutOrm.create(checkoutDoc);
//         await transaction.update(docRef, { items: [], updatedAt: new Date() });
//         return { orderId, total };
//       });
//       if (validationError) {
//         return err({ type: 'ValidationError', message: validationMsg });
//       }
//       return ok(result);
//     } catch (error) {
//       logger.error('[checkout] Firestore transaction error', { userId, error });
//       return err({ type: 'Unknown', message: 'Checkout failed' });
//     }
//   }
// }

// export const kemetMartService = new KemetMartService();