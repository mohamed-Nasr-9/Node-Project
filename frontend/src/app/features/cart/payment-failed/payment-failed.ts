import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute , Router } from '@angular/router';

@Component({
  selector: 'app-payment-failed',
  standalone: false,
  templateUrl: './payment-failed.html',
  styleUrl: './payment-failed.css',
})
export class PaymentFailed implements OnInit, OnDestroy {
  seconds = 100;
  private timerId: any;

  constructor(private router: Router) {}

  ngOnInit(): void {
    localStorage.removeItem('lastOrder');
    this.timerId = setInterval(() => {
      this.seconds--;
      if (this.seconds <= 0) {
        clearInterval(this.timerId);
        this.router.navigateByUrl('/');
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  goHomeNow() {
    this.router.navigateByUrl('/');
  }
}
