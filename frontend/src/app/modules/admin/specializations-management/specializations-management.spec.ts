import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpecializationsManagement } from './specializations-management';

describe('SpecializationsManagement', () => {
  let component: SpecializationsManagement;
  let fixture: ComponentFixture<SpecializationsManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpecializationsManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpecializationsManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
