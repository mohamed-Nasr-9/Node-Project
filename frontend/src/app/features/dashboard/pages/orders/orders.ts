import { Component } from '@angular/core';
import { Order } from '../ordersTypes';
import { OrderService } from '../services/order-service';

@Component({
  selector: 'app-orders',
  standalone: false,
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders {
  loading = false;
  error: string | null = null;
  query = '';
  orders: Order[] = [];
  selected: Order | null = null;

  flashText: string | null = null;
  flashType: 'success' | 'danger' | 'info' = 'info';
  flashTimeout?: any;

  constructor(private api: OrderService) { }

  ngOnInit(): void {
    this.load();
  }

  showMessage(type: 'success'|'danger'|'info', text: string) {
  this.flashType = type;
  this.flashText = text;

  if (this.flashTimeout) {
    clearTimeout(this.flashTimeout);
  }
  this.flashTimeout = setTimeout(() => {
    this.flashText = null;
  }, 3000); 
}

  // load() {
  //   this.loading = true;
  //   this.error = null;
  //   this.api.getAll().subscribe({
  //     next: r => { this.orders = r.allOrders ?? []; this.loading = false; },
  //     error: (err) => {
  //       console.error('Orders load error:', err);
  //       this.error = (err?.status ? `[${err.status}] ` : '') + 'Failed to load orders';
  //       this.loading = false;
  //     }
  //   });
  // }
  load() {
  this.loading = true;
  this.error = null;

  this.api.getAll().subscribe({
    next: (res) => {
      this.orders = (res.allOrders ?? []).sort((a,b) =>
        new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
      );
      this.loading = false;

      if (res.message) {
        this.showMessage('success', res.message); 
      }
    },
    error: (err) => {
      console.error('Orders load error:', err);
      this.error = 'Failed to load orders';
      const msg = err.error?.message || 'Failed to load orders';
      this.showMessage('danger', msg);
      this.loading = false;
    }
  });
}


  get filtered() {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.orders;
    return this.orders.filter(o =>
      o._id.toLowerCase().includes(q) ||
      o.shippingAddress.fullName.toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q)
    );
  }

  openDetails(o: Order) {
    this.selected = o;
  }
  cancel(o: Order) {
    this.call(o._id, 'cancel');
  }
  paid(o: Order) {
    this.call(o._id, 'paid');
  }
  shipped(o: Order) {
    this.call(o._id, 'shipped');
  }
  delivered(o: Order) {
    this.call(o._id, 'delivered');
  }

  statusClass(s: string) {
    const k = (s || '').toLowerCase();
    const map: Record<string, string> = {
      paid: 'bg-success-subtle text-success',
      delivered: 'bg-success-subtle text-success',
      shipped: 'bg-info-subtle text-info',
      pending: 'bg-warning-subtle text-warning',
      canceled: 'bg-danger-subtle text-danger',
      cancelled: 'bg-danger-subtle text-danger',
      refunded: 'bg-danger-subtle text-danger'  
    };
    return map[k] || 'bg-secondary-subtle text-secondary';
  }

  statusLabel(s: string) {
    const k = (s || '').toLowerCase();
    if (k === 'refunded') return 'Refunded';
    if (k === 'cancelled' || k === 'canceled') return 'Cancelled';
    return k.charAt(0).toUpperCase() + k.slice(1);
  }

  private call(id: string, kind: 'cancel'|'paid'|'shipped'|'delivered') {
  const fn = {
    cancel:    () => this.api.cancel(id),
    paid:      () => this.api.markPaid(id),
    shipped:   () => this.api.markShipped(id),
    delivered: () => this.api.markDelivered(id),
  }[kind];

  fn().subscribe({
    next: (res) => {
      this.load();

      const msg = res.message || 'Order updated successfully';
      this.showMessage('success', msg);
    },
    error: (err) => {
      console.error('Action error:', err);
      const msg = err.error?.message || 'Failed to update order';
      this.showMessage('danger', msg);
    }
  });
}

}
