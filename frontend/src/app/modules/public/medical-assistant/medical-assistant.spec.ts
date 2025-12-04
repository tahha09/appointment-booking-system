import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicalAssistant } from './medical-assistant';

describe('MedicalAssistant', () => {
  let component: MedicalAssistant;
  let fixture: ComponentFixture<MedicalAssistant>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicalAssistant]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedicalAssistant);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
