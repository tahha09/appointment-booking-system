import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorApproval } from './doctor-approval';

describe('DoctorApproval', () => {
  let component: DoctorApproval;
  let fixture: ComponentFixture<DoctorApproval>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorApproval]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorApproval);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
