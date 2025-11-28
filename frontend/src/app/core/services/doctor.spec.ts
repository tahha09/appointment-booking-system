import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DoctorService } from './doctor';

describe('DoctorService', () => {
  let service: DoctorService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DoctorService]
    });
    service = TestBed.inject(DoctorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should retrieve doctors', () => {
    const mockDoctors = { data: [{ id: 1, name: 'Dr. Smith' }] };

    service.getDoctors().subscribe(doctors => {
      expect(doctors).toEqual(mockDoctors);
    });

    const req = httpMock.expectOne('http://localhost:8000/api/doctors');
    expect(req.request.method).toBe('GET');
    req.flush(mockDoctors);
  });

  it('should retrieve a doctor by id', () => {
    const mockDoctor = { data: { id: 1, name: 'Dr. Smith' } };
    const doctorId = 1;

    service.getDoctorById(doctorId).subscribe(doctor => {
      expect(doctor).toEqual(mockDoctor);
    });

    const req = httpMock.expectOne(`http://localhost:8000/api/doctors/${doctorId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDoctor);
  });
});
