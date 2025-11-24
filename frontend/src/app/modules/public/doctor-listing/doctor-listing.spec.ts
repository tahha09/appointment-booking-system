import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorListing } from './doctor-listing';

describe('DoctorListing', () => {
  let component: DoctorListing;
  let fixture: ComponentFixture<DoctorListing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorListing]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorListing);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
