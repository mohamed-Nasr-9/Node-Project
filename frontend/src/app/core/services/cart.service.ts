import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  Cart, 
  CartResponse, 
  AddToCartRequest, 
  UpdateCartRequest 
} from '../models/cart.model';
import { environment } from '../../../environments/environment.prod';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = environment.apiUrl + '/cart';
  
  // Observable للـ cart
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  public cart$ = this.cartSubject.asObservable();
  
  // Observable لعدد الـ items
  private cartCountSubject = new BehaviorSubject<number>(0);
  public cartCount$ = this.cartCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Helper: Get headers with token
  private getHeaders(): HttpHeaders {
    return this.authService.getAuthHeaders();
  }

  // 1️⃣ Get Cart
  getCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      tap(response => {
        if (response.success) {
          this.cartSubject.next(response.data);
          this.updateCartCount(response.data);
        }
      })
    );
  }

  // 2️⃣ Add to Cart
  addToCart(request: AddToCartRequest): Observable<CartResponse> {
    return this.http.post<CartResponse>(this.apiUrl, request, { headers: this.getHeaders() }).pipe(
      tap(response => {
        if (response.success) {
          this.cartSubject.next(response.data);
          this.updateCartCount(response.data);
        }
      })
    );
  }

  // 3️⃣ Update Cart Item
  updateCartItem(request: UpdateCartRequest): Observable<CartResponse> {
    return this.http.put<CartResponse>(this.apiUrl, request, { headers: this.getHeaders() }).pipe(
      tap(response => {
        if (response.success) {
          this.cartSubject.next(response.data);
          this.updateCartCount(response.data);
        }
      })
    );
  }

  // 4️⃣ Remove from Cart
  removeFromCart(bookId: string): Observable<CartResponse> {
    return this.http.delete<CartResponse>(`${this.apiUrl}/${bookId}`, { headers: this.getHeaders() }).pipe(
      tap(response => {
        if (response.success) {
          this.cartSubject.next(response.data);
          this.updateCartCount(response.data);
        }
      })
    );
  }

  // 5️⃣ Clear Cart
  clearCart(): Observable<CartResponse> {
    return this.http.delete<CartResponse>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      tap(response => {
        if (response.success) {
          this.cartSubject.next(response.data);
          this.updateCartCount(response.data);
        }
      })
    );
  }

  // Helper: Update cart count
  private updateCartCount(cart: Cart): void {
    const count = cart.items.reduce((total, item) => total + item.qty, 0);
    this.cartCountSubject.next(count);
  }

  // Helper: Get current cart
  getCurrentCart(): Cart | null {
    return this.cartSubject.value;
  }

  // Helper: Get cart total
  getCartTotal(): number {
    const cart = this.cartSubject.value;
    return cart ? cart.totals.subTotal : 0;
  }
}