import { Collection } from "../infrastructure/firestore/collection.decorator";

export class CartItem {
  productId!: string;
  quantity!: number;
  price!: number;
}

@Collection('kemetmart_carts')
export class Cart {
  id: string = '';
  userId!: string;
  items!: CartItem[];
  updatedAt!: Date;
}
