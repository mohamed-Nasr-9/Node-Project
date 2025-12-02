import { TestBed } from '@angular/core/testing';

import { Forgetpasswordservice } from './forgetpasswordservice';

describe('Forgetpasswordservice', () => {
  let service: Forgetpasswordservice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Forgetpasswordservice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
