import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentsAnalytics } from './appointments-analytics';

describe('AppointmentsAnalytics', () => {
  let component: AppointmentsAnalytics;
  let fixture: ComponentFixture<AppointmentsAnalytics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentsAnalytics]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppointmentsAnalytics);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
