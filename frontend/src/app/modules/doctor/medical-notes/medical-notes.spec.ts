import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicalNotes } from './medical-notes';

describe('MedicalNotes', () => {
  let component: MedicalNotes;
  let fixture: ComponentFixture<MedicalNotes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicalNotes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedicalNotes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
