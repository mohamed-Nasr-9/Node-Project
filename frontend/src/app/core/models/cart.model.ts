export interface Book {
  _id: string;
  title: string;
  author?: string;
  price: number;
  stock: number;
  image?: {
    url: string;
  };
  isActive?: boolean;
}

export interface CartItem {
  _id?: string;
  bookId: string | Book;
  qty: number;
  priceAtAdd: number;
  stockAvailable?: number;
  isInStock?: boolean;
}

export interface Cart {
  _id?: string;
  userId: string;
  items: CartItem[];
  totals: {
    subTotal: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CartResponse {
  success: boolean;
  message?: string;
  data: Cart;
}

export interface AddToCartRequest {
  bookId: string;
  qty: number;
}

export interface UpdateCartRequest {
  bookId: string;
  qty: number;
}