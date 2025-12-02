import { Injectable } from '@angular/core';
import { HttpClient , HttpHeaders } from '@angular/common/http';
// import { environment} from '../../../environments/environment.prod';
import { Order, SingleOrderResponse } from '../dashboard/pages/ordersTypes';
import { Observable } from 'rxjs';
import { environment} from '../../../environments/environment.prod';

export interface PlaceOrderBody {
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    city?: string;
    country?: string;
    line1?: string;
    line2?: string;
    postalCode?: string;
  };
  payment?: {
    couponCode?: string;
  };
}

export interface PlaceOrderResponse {
  message: string;
  status: string;
  code: number;
  order: Order;
}

export interface CheckoutResponse {
  message: string;
  status: string;
  code: number;
  url?: string;      
  checkoutUrl?: string; 
}


const API = environment.apiUrl;

@Injectable({
  providedIn: 'root',
})
export class CartOrders {
   constructor(private http: HttpClient) {}

   private getHeaders(): HttpHeaders {
   const token = localStorage.getItem('token');  
   return new HttpHeaders({
    Authorization: `Bearer ${token}`
   });
   }

  placeOrder(body: PlaceOrderBody) {
  return this.http.post<PlaceOrderResponse>(
    `${API}/orders`,
    body,
    { headers: this.getHeaders() }
  );
  }

  createCheckout(orderId: string) {
  return this.http.post<CheckoutResponse>(
    `${API}/payments/create-checkout/${orderId}`,
    {},
    { headers: this.getHeaders() }
  );
  }

  cancelOrder(orderId: string): Observable<SingleOrderResponse> {
    return this.http.post<SingleOrderResponse>(
      `${API}/orders/${orderId}/cancel`,
      {},
      { headers: this.getHeaders() }
    );
  }
}
