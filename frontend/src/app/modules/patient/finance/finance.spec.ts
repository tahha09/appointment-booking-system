import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Finance } from './finance';
import { Auth } from '../../../core/services/auth';
import { Notification } from '../../../core/services/notification';
import { environment } from '../../../../environments/environment';

class MockAuth {
  getToken(): string {
    return 'test-token';
  }
}

class MockNotification {
  error(): void {}
}

describe('Finance', () => {
  let component: Finance;
  let fixture: ComponentFixture<Finance>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, Finance],
      providers: [
        { provide: Auth, useClass: MockAuth },
        { provide: Notification, useClass: MockNotification },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Finance);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    const req = httpMock.expectOne((request) => {
      return (
        request.url === `${environment.apiUrl}/patient/finance` &&
        request.params.get('page') === '1' &&
        !request.params.has('per_page')
      );
    });
    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      data: {
        transactions: [],
        summary: {
          total_transactions: 0,
          total_paid: 0,
          total_refunded: 0,
          total_on_hold: 0,
          last_transaction_at: null,
        },
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: 5,
          total: 0,
        },
      },
    });
    expect(component).toBeTruthy();
  });
});
