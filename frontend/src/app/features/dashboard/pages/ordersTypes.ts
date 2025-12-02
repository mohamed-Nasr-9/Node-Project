export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'canceled' | 'Refunded';

export interface OrderItem {
  bookId: string;
  priceAtAdd: number;
  qty: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  city: string;
  country: string;
}

export interface Amounts {
  itemsTotal: number;
  shipping: number;
  discount: number;
  grandTotal: number;
}

export interface Payment {
  method: string;
  status: string;
  txId?: string;
}

export interface Order {
  _id: string;
  userId: string;
  status: OrderStatus;
  currency: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  amounts: Amounts;
  placedAt: string;
  payment?: Payment;
}


export interface GetAllOrdersResponse {
  message: string;
  status: string;
  code: number;
  allOrders: Order[];
}

export interface SingleOrderResponse {
  message: string;
  status: string;
  code: number;
  order: Order;
}
