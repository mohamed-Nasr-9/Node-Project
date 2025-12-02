import { Component, OnDestroy, OnInit } from '@angular/core';
import { Cart, CartItem } from '../../../core/models/cart.model';
import { Subscription } from 'rxjs';
import { CartOrders, PlaceOrderBody } from '../cart-orders';
import { CartService } from '../../../core/services/cart.service';
import { Router } from '@angular/router';


declare const bootstrap: any; 

@Component({
  selector: 'app-payment',
  standalone: false,
  templateUrl: './payment.html',
  styleUrl: './payment.css',
})
export class Payment implements OnInit, OnDestroy {
 
  cart: Cart | null = null;
  loading = false;

  lastOrder: any = null;

  shippingName = '';
  shippingCity = '';
  shippingCountry = '';
  shippingPhone = '';
  shippingLine1 = '';
  shippingLine2 = '';
  shippingPostalCode = '';

  couponCode = '';

  flashText: string | null = null;
  flashType: 'success' | 'danger' | 'info' = 'info';
  flashTimeout?: any;
  checkoutLoading = false;

  private sub?: Subscription;

  constructor(
    private cartService: CartService,
    private cartOrders: CartOrders,
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
    if (this.flashTimeout) clearTimeout(this.flashTimeout);
  }

  loadCart() {
    this.loading = true;
    this.sub = this.cartService.getCart().subscribe({
      next: res => {
        this.cart = res.data;
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.loading = false;
        this.showMessageIn('danger', err.error?.message || 'Failed to load cart');
      }
    });
  }

  get cartItems(): CartItem[] {
    return this.cart?.items || [];
  }

  get isEmpty(): boolean {
    return !this.cart || !this.cart.items || this.cart.items.length === 0;
  }

  get subtotal(): number {
    return this.cart?.totals.subTotal || 0;
  }

  showMessageIn(type: 'success'|'danger'|'info', text: string) {
    this.flashType = type;
    this.flashText = text;

    if (this.flashTimeout) {
      clearTimeout(this.flashTimeout);
    }
    this.flashTimeout = setTimeout(() => {
      this.flashText = null;
    }, 3000);
  }

  checkoutOfOrder() {
    if (this.checkoutLoading || this.isEmpty) return;

    this.checkoutLoading = true;
    this.showMessageIn('info', 'Placing your order...');

    const body: PlaceOrderBody = {};

    const hasShipping =
      this.shippingName.trim() ||
      this.shippingCity.trim() ||
      this.shippingCountry.trim() ||
      this.shippingPhone.trim() ||
      this.shippingLine1.trim() ||
      this.shippingLine2.trim() ||
      this.shippingPostalCode.trim();

    if (hasShipping) {
      body.shippingAddress = {
        fullName: this.shippingName.trim() || undefined,
        phone: this.shippingPhone.trim() || undefined,
        city: this.shippingCity.trim() || undefined,
        country: this.shippingCountry.trim() || undefined,
        line1: this.shippingLine1.trim() || undefined,
        line2: this.shippingLine2.trim() || undefined,
        postalCode: this.shippingPostalCode.trim() || undefined,
      } as any;
    }

    if (this.couponCode.trim()) {
      body.payment = { couponCode: this.couponCode.trim() } as any;
    }

    this.cartOrders.placeOrder(body).subscribe({
      next: (res: any) => {
        this.checkoutLoading = false;

        this.lastOrder = res.order;
        try {
          localStorage.setItem('lastOrder', JSON.stringify(res.order));
        } catch {}

        this.showMessageIn('success', res.message || 'Order placed successfully.');

        this.openConfirmModal();
      },
      error: (err) => {
        this.checkoutLoading = false;
        const msg = err.error?.message || 'Failed to place order.';
        this.showMessageIn('danger', msg);
      }
    });
  }

  openConfirmModal() {
    const modalEl = document.getElementById('paymentConfirmModal');
    if (!modalEl) return;

    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  startStripeCheckout() {
    const id = this.lastOrder?._id;
    if (!id) {
      this.showMessageIn('danger', 'No order found to pay.');
      return;
    }

    this.checkoutLoading = true;
    this.showMessageIn('info', 'Redirecting to payment...');

    this.cartOrders.createCheckout(id).subscribe({
      next: (chk: any) => {
        this.checkoutLoading = false;
        const url = chk.url || chk.checkoutUrl || '';
        if (url) {
          window.location.href = url;
        } else {
          this.showMessageIn('danger', 'Payment URL not found from server.');
        }
      },
      error: (err) => {
        this.checkoutLoading = false;
        const msg = err.error?.message || 'Failed to start payment session.';
        this.showMessageIn('danger', msg);
      }
    });
  }

  cancelCurrentOrder() {
    if (!this.lastOrder?._id || this.checkoutLoading) return;

    if (!confirm('Are you sure you want to cancel this order?')) return;

    this.checkoutLoading = true;
    this.showMessageIn('info', 'Cancelling your order...');

    const orderId = this.lastOrder._id;

    this.cartOrders.cancelOrder(orderId).subscribe({
      next: (res: any) => {
        this.checkoutLoading = false;

        try {
          localStorage.removeItem('lastOrder');
        } catch {}

        this.lastOrder = null;

        this.showMessageIn('success', res.message || 'Order cancelled successfully.');

        const modalEl = document.getElementById('paymentConfirmModal');
        if (modalEl) {
          const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
          modal.hide();
        }

        this.loadCart();
      },
      error: (err) => {
        this.checkoutLoading = false;
        const msg = err.error?.message || 'Failed to cancel order.';
        this.showMessageIn('danger', msg);
      }
    });
  }


}
