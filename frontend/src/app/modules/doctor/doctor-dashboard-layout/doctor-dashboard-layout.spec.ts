import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorDashboardLayout } from './doctor-dashboard-layout';

describe('DoctorDashboardLayout', () => {
  let component: DoctorDashboardLayout;
  let fixture: ComponentFixture<DoctorDashboardLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorDashboardLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorDashboardLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
