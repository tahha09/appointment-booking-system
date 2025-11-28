import { TestBed } from '@angular/core/testing';

import { Specialization } from './specialization';

describe('Specialization', () => {
  let service: Specialization;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Specialization);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
