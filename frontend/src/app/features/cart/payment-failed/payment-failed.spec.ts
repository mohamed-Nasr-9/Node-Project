import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentFailed } from './payment-failed';

describe('PaymentFailed', () => {
  let component: PaymentFailed;
  let fixture: ComponentFixture<PaymentFailed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PaymentFailed]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentFailed);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
