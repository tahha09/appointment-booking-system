import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentsAdmin } from './appointments-admin';

describe('AppointmentsAdmin', () => {
  let component: AppointmentsAdmin;
  let fixture: ComponentFixture<AppointmentsAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentsAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppointmentsAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
