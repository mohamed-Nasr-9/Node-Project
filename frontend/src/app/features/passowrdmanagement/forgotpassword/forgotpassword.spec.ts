import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Forgotpassword } from './forgotpassword';

describe('Forgotpassword', () => {
  let component: Forgotpassword;
  let fixture: ComponentFixture<Forgotpassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Forgotpassword]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Forgotpassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
