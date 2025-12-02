import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Discount } from './discount';

describe('Discount', () => {
  let component: Discount;
  let fixture: ComponentFixture<Discount>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Discount]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Discount);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
