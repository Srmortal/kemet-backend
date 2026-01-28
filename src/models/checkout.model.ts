import { Collection } from "../infrastructure/firestore/collection.decorator";

export class CheckoutItem {
  productId!: string;
  quantity!: number;
  price!: number;
}


@Collection('kemetmart_checkouts')
export class Checkout {
  id: string = '';
  orderId!: string;
  userId!: string;
  items!: CheckoutItem[];
  total!: number;
  createdAt!: Date;
  status!: 'pending' | 'completed' | 'failed';
  // Payment-related fields
  paymentStatus!: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod!: 'card' | 'cash' | 'wallet' | 'bank_transfer';
  paymentTransactionId?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentDate?: Date;
  // Shipping fields (optional)
  shippingAddress?: string;
  shippingMethod?: string;
}
