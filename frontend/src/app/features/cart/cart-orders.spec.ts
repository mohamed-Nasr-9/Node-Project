import { TestBed } from '@angular/core/testing';

import { CartOrders } from './cart-orders';

describe('CartOrders', () => {
  let service: CartOrders;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartOrders);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
