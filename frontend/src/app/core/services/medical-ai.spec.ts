import { TestBed } from '@angular/core/testing';

import { MedicalAiService } from './medical-ai';

describe('MedicalAiService', () => {
  let service: MedicalAiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MedicalAiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
