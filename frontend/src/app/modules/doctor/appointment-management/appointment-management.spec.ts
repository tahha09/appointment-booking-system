import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentManagement } from './appointment-management';

describe('AppointmentManagement', () => {
  let component: AppointmentManagement;
  let fixture: ComponentFixture<AppointmentManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppointmentManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
