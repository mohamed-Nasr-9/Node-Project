import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

interface LastOrder {
  _id: string;
  status: string;
  currency: string;
  placedAt: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    city: string;
    country: string;
  };
  amounts: {
    itemsTotal: number;
    shipping: number;
    discount: number;
    grandTotal: number;
  };
  items: {
    bookId: string;
    qty: number;
    priceAtAdd: number;
  }[];
}


@Component({
  selector: 'app-payment-success',
  standalone: false,
  templateUrl: './payment-success.html',
  styleUrl: './payment-success.css',
})
export class PaymentSuccess implements OnInit {
  // seconds = 5;
  sessionId?: string | null;
  // private timerId: any;
  order: LastOrder | null = null;

  constructor(private route: ActivatedRoute,
              private router: Router) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.queryParamMap.get('session_id');

    try {
      const saved = localStorage.getItem('lastOrder');
      if (saved) {
        this.order = JSON.parse(saved);
        localStorage.removeItem('lastOrder');
      }
    } catch {
      this.order = null;
    }



    // this.timerId = setInterval(() => {
    //   this.seconds--;
    //   if (this.seconds <= 0) {
    //     clearInterval(this.timerId);
    //     this.router.navigateByUrl('/');
    //   }
    // }, 1000);
  }

  // ngOnDestroy(): void {
  //   if (this.timerId) {
  //     clearInterval(this.timerId);
  //   }
  // }

  goNow() {
    this.router.navigateByUrl('/');
  }
}


