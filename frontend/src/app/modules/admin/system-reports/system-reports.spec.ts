import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemReports } from './system-reports';

describe('SystemReports', () => {
  let component: SystemReports;
  let fixture: ComponentFixture<SystemReports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SystemReports]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SystemReports);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
