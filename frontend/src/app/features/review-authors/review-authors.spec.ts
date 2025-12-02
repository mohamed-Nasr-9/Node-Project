import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewAuthorsComponent } from './review-authors';

describe('ReviewAuthorsComponent', () => {
  let component: ReviewAuthorsComponent;
  let fixture: ComponentFixture<ReviewAuthorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReviewAuthorsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReviewAuthorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

