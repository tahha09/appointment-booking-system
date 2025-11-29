import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemOverview } from './system-overview';

describe('SystemOverview', () => {
  let component: SystemOverview;
  let fixture: ComponentFixture<SystemOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SystemOverview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SystemOverview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
