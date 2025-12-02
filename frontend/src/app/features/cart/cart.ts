import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CartService } from '../../core/services/cart.service';
import { Cart, CartItem, Book } from '../../core/models/cart.model';
import { CartOrders, PlaceOrderBody } from './cart-orders';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-cart',
  standalone: false,
  templateUrl: './cart.html',
  styleUrls: ['./cart.scss'],
})
export class CartComponent implements OnInit, OnDestroy {
  cart: Cart | null = null;
  loading = false;
  isEmpty = false;

//=====variable of payment & orders==========================
  // shippingName: string = '';
  // shippingCity: string = '';
  // shippingCountry: string = '';
  // shippingPhone: string = '';
  // couponCode: string = '';
  // flashText: string | null = null;
  // flashType: 'success' | 'danger' | 'info' = 'info';
  // flashTimeout?: any;
  // checkoutLoading = false;
//=======================================================


  
  private destroy$ = new Subject<void>();

  constructor(
    private cartService: CartService,
    private snackBar: MatSnackBar,
    private router: Router,
    private cartOrders: CartOrders,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Load cart from API
  loadCart(): void {
    this.loading = true;
    
    this.cartService.getCart()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.cart = response.data;
          this.isEmpty = !this.cart.items || this.cart.items.length === 0;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading cart:', error);
          this.showMessage(error.error?.message || 'Error loading cart');
          this.loading = false;
          this.isEmpty = true;
        }
      });
  }

  // Get book from item
  getBook(item: CartItem): Book | null {
    return typeof item.bookId === 'object' ? item.bookId as Book : null;
  }

  // Get book ID
  getBookId(item: CartItem): string {
    const book = this.getBook(item);
    return book ? book._id : (item.bookId as string);
  }

  // حساب الـ subtotal
  get subtotal(): number {
    return this.cart?.totals.subTotal || 0;
  }

  // حساب عدد الـ items
  get itemCount(): number {
    return this.cart?.items.reduce((total, item) => total + item.qty, 0) || 0;
  }

  // Get cart items
  get cartItems(): CartItem[] {
    return this.cart?.items || [];
  }

  // زيادة الكمية
  increaseQty(item: CartItem): void {
    const book = this.getBook(item);
    const maxStock = item.stockAvailable || book?.stock || 0;
    
    if (item.qty >= maxStock) {
      this.showMessage('Maximum stock reached!');
      return;
    }

    this.updateQuantity(item, item.qty + 1);
  }

  // تقليل الكمية
  decreaseQty(item: CartItem): void {
    if (item.qty <= 1) {
      return;
    }

    this.updateQuantity(item, item.qty - 1);
  }

  // تحديث الكمية
  updateQty(item: CartItem, event: any): void {
    const newQty = parseInt(event.target.value);
    const book = this.getBook(item);
    const maxStock = item.stockAvailable || book?.stock || 0;

    if (isNaN(newQty) || newQty < 1) {
      event.target.value = 1;
      this.updateQuantity(item, 1);
      return;
    }

    if (newQty > maxStock) {
      this.showMessage(`Only ${maxStock} items available`);
      event.target.value = maxStock;
      this.updateQuantity(item, maxStock);
      return;
    }

    this.updateQuantity(item, newQty);
  }

  // Update quantity API call
  private updateQuantity(item: CartItem, newQty: number): void {
    const bookId = this.getBookId(item);
    
    this.cartService.updateCartItem({ bookId, qty: newQty })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.cart = response.data;
          this.showMessage('Cart updated');
        },
        error: (error) => {
          console.error('Error updating cart:', error);
          this.showMessage(error.error?.message || 'Error updating cart');
          this.loadCart(); // Reload to get correct data
        }
      });
  }

  // حذف item
  removeItem(item: CartItem): void {
    const book = this.getBook(item);
    const title = book?.title || 'this item';
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Remove Item',
        message: `Remove "${title}" from cart?`,
        confirmText: 'Remove',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const bookId = this.getBookId(item);
        
        this.cartService.removeFromCart(bookId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.cart = response.data;
              this.isEmpty = this.cart.items.length === 0;
              this.showMessage('Item removed from cart');
            },
            error: (error) => {
              console.error('Error removing item:', error);
              this.showMessage(error.error?.message || 'Error removing item');
            }
          });
      }
    });
  }

  // مسح الـ cart
  clearCart(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Clear Cart',
        message: 'Clear all items from cart?',
        confirmText: 'Clear',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cartService.clearCart()
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.cart = response.data;
              this.isEmpty = true;
              this.showMessage('Cart cleared');
            },
            error: (error) => {
              console.error('Error clearing cart:', error);
              this.showMessage(error.error?.message || 'Error clearing cart');
            }
          });
      }
    });
  }

  // الـ checkout
  checkout(): void {
    if (this.isEmpty) {
      this.showMessage('Cart is empty!');
      return;
    }

    const outOfStockItems = this.cartItems.filter(item => !item.isInStock);
    
    if (outOfStockItems.length > 0) {
      this.showMessage('Some items are out of stock. Please remove them before checkout.');
      return;
    }

    // TODO: Navigate to checkout
    this.router.navigate(['/checkout']);
  }

  // الـ item total
  getItemTotal(item: CartItem): number {
    return item.priceAtAdd * item.qty;
  }

  // Show snackbar message
  private showMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
//=====================payment & orders ==============================================
  // showMessageIn(type: 'success'|'danger'|'info', text: string) {
  //   this.flashType = type;
  //   this.flashText = text;

  //   if (this.flashTimeout) {
  //     clearTimeout(this.flashTimeout);
  //   }
  //   this.flashTimeout = setTimeout(() => {
  //     this.flashText = null;
  //   }, 3000);
  // }

  // checkoutOfOrder() {
  //   if (this.checkoutLoading || !this.cartItems || this.cartItems.length === 0) {
  //     return;
  //   }

  //   this.checkoutLoading = true;
  //   this.showMessageIn('info', 'Placing your order...');

  //   const body: PlaceOrderBody = {};

  //   const hasShipping =
  //     this.shippingName.trim() ||
  //     this.shippingCity.trim() ||
  //     this.shippingCountry.trim() ||
  //     this.shippingPhone.trim();

  //   if (hasShipping) {
  //     body.shippingAddress = {
  //       fullName: this.shippingName.trim() || undefined,
  //       phone: this.shippingPhone.trim() || undefined,
  //       city: this.shippingCity.trim() || undefined,
  //       country: this.shippingCountry.trim() || undefined,
  //     };
  //   }

  //   if (this.couponCode.trim()) {
  //     body.payment = {
  //       couponCode: this.couponCode.trim()
  //     };
  //   }

  //   // 1) place order
  //   this.cartOrders.placeOrder(body).subscribe({
  //     next: (res) => {
  //       const orderId = res.order._id;
        
  //       try {
  //         localStorage.setItem('lastOrder', JSON.stringify(res.order));
  //       } catch {}

  //       this.showMessageIn('success', res.message || 'Order placed, redirecting to payment...');

  //       // 2) create checkout
  //       this.cartOrders.createCheckout(orderId).subscribe({
  //         next: (chk) => {
  //           this.checkoutLoading = false;
  //           const url = chk.url || chk.checkoutUrl || '';

  //           if (url) {
  //             window.location.href = url; //  Stripe Hosted Checkout
  //           } else {
  //             this.showMessageIn('danger', 'Payment URL not found from server.');
  //           }
  //         },
  //         error: (err) => {
  //           this.checkoutLoading = false;
  //           const msg = err.error?.message || 'Failed to start payment session.';
  //           this.showMessageIn('danger', msg);
  //         }
  //       });
  //     },
  //     error: (err) => {
  //       this.checkoutLoading = false;
  //       const msg = err.error?.message || 'Failed to place order.';
  //       this.showMessageIn('danger', msg);
  //     }
  //   });
  // }

}