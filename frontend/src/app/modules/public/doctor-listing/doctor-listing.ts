import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Doctor, DoctorResponse, DoctorsListResponse } from '../../../models/doctor';
import { DoctorService } from '../../../core/services/doctor';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Header } from '../../../shared/components/header/header';
import { Footer } from '../../../shared/components/footer/footer';
import { BookingService } from '../../../core/services/booking.service';

interface Specialization {
  id: number;
  name: string;
  description: string;
  doctors_count: number;
  created_at: string;
  updated_at: string;
  is_popular: boolean;
  has_available_doctors: boolean;
}

interface FilterListResponse {
  success: boolean;
  message: string;
  data: Specialization[];
}
@Component({
  selector: 'app-doctor-listing',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, Header, Footer],
  templateUrl: './doctor-listing.html',
  styleUrls: ['./doctor-listing.scss']
})

export class DoctorListing implements OnInit, OnDestroy {
  doctors: Doctor[] = [];
  loading: boolean = true;
  error: string = '';

  // Filtering properties
  searchTerm: string = '';
  selectedSpecializations: number[] = [];
  allSpecializations: Specialization[] = [];

  // Pagination properties
  currentPage: number = 1;
  totalPages: number = 1;
  totalItems: number = 0;
  itemsPerPage: number = 6;

  // Search debounce
  private searchSubject = new Subject<string>();

  constructor(
    private doctorService: DoctorService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private bookingService: BookingService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // إعداد debounce للبحث
    this.setupSearchDebounce();
    this.loadFilterList();
    this.loadDoctors();
  }

  private setupSearchDebounce() {
    this.searchSubject.pipe(
      debounceTime(300), // انتظر 300ms بعد آخر ضغطة
      distinctUntilChanged() // لا ترسل إذا القيمة لم تتغير
    ).subscribe(searchTerm => {
      this.currentPage = 1;
      this.loadDoctors();
    });
  }

  // جلب قائمة التخصصات للفلاتر
  loadFilterList() {
    this.http.get<FilterListResponse>('http://localhost:8000/api/specializations/filter-list')
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.allSpecializations = response.data;
          }
        },
        error: (error) => {
          console.error('Error loading filter list:', error);
          this.error = 'Failed to load filter list';
        }
      });
  }

  // جلب البيانات من الـ API مع الفلاتر
  loadDoctors() {
    this.loading = true;
    this.error = '';

    const params: Record<string, string | number | undefined> = {
      page: this.currentPage,
      per_page: this.itemsPerPage,
    };

    // إضافة البحث إذا موجود
    if (this.searchTerm) {
      params['search'] = this.searchTerm;
    }

    // إضافة التخصصات المحددة إذا موجودة
    if (this.selectedSpecializations.length > 0) {
      params['specialization_id'] = this.selectedSpecializations.join(',');
    }

    this.doctorService.getDoctorsByFilters(params).subscribe({
      next: (response: DoctorResponse) => {
        if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            // Case 1: data is directly an array of doctors
            this.doctors = response.data;
            this.totalItems = response.data.length;
            this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
          } else if ('doctors' in response.data) {
            // Case 2: data has a doctors property (DoctorsListResponse)
            this.doctors = response.data.doctors;
            this.currentPage = response.data.pagination.current_page;
            this.totalPages = response.data.pagination.last_page;
            this.totalItems = response.data.pagination.total;
          } else {
            // Case 3: data is a single doctor object (wrap in array)
            this.doctors = [response.data as any];
            this.totalItems = 1;
            this.totalPages = 1;
          }
        } else {
          this.doctors = [];
          this.totalItems = 0;
          this.totalPages = 1;
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.error = 'Network error: Unable to connect to server';
        this.loading = false;
        console.error('Error loading doctors:', error);
        this.cdr.detectChanges();
      }
    });
  }

  getStarRating(rating: string): number[] {
    const numericRating = parseFloat(rating);
    const fullStars = Math.floor(numericRating);
    const hasHalfStar = numericRating % 1 >= 0.5;

    const stars = Array(fullStars).fill(1);
    if (hasHalfStar) stars.push(0.5);
    while (stars.length < 5) stars.push(0);

    return stars;
  }

  bookAppointment(doctor: Doctor): void {
    if (!doctor) {
      return;
    }
    this.bookingService.startBooking({
      doctor: {
        id: doctor.id,
        name: doctor.user?.name,
        specialization: doctor.specialization?.name,
        fee: doctor.consultation_fee,
      },
      extras: { source: 'doctor-listing' },
    });
  }

  // Method to view doctor details
  viewDoctorDetails(doctor: Doctor): void {
    this.router.navigate(['/doctors', doctor.id]);
  }

  // البحث
  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  // تبديل اختيار التخصص - مع إعادة تحميل فورية
  onSpecializationToggle(specId: number, event?: Event) {
    if (event) {
      event.stopPropagation(); // منع انتشار الحدث إذا كان من checkbox
    }

    const index = this.selectedSpecializations.indexOf(specId);

    if (index > -1) {
      this.selectedSpecializations.splice(index, 1);
    } else {
      this.selectedSpecializations.push(specId);
    }

    // إعادة التحميل بعد تغيير الفلاتر
    this.currentPage = 1;
    this.loadDoctors();
  }

  // التحقق إذا التخصص مختار
  isSelected(specId: number): boolean {
    return this.selectedSpecializations.includes(specId);
  }

  // الحصول على اسم التخصص
  getSpecializationName(specId: number): string {
    const spec = this.allSpecializations.find(s => s.id === specId);
    return spec ? spec.name : 'Unknown';
  }

  // مسح كل الفلاتر
  clearFilters() {
    this.searchTerm = '';
    this.selectedSpecializations = [];
    this.currentPage = 1;
    this.loadDoctors();
  }

  // إزالة فلتر تخصص محدد
  removeSpecializationFilter(specId: number) {
    const index = this.selectedSpecializations.indexOf(specId);
    if (index > -1) {
      this.selectedSpecializations.splice(index, 1);
      this.currentPage = 1;
      this.loadDoctors();
    }
  }

  // التصفح
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadDoctors();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadDoctors();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadDoctors();
    }
  }

  // الحصول على أرقام الصفحات للعرض
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    // تعديل startPage إذا endPage قريب من النهاية
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  // تنظيف الاشتراكات عند تدمير المكون
  ngOnDestroy() {
    this.searchSubject.complete();
  }
}
