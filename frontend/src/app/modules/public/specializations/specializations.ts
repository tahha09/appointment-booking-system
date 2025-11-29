import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Header } from "../../../shared/components/header/header";
import { Footer } from "../../../shared/components/footer/footer";


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

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    specializations: Specialization[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
    filters: {
      search: string;
      specialization_ids: number[];
      sort_by: string;
      sort_order: string;
    };
  };
}

interface FilterListResponse {
  success: boolean;
  message: string;
  data: Specialization[];
}

@Component({
  selector: 'app-specializations',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule ,Header,Footer],
  templateUrl: './specializations.html',
  styleUrls: ['./specializations.scss']
})
export class Specializations implements OnInit, OnDestroy {
  // البيانات الأساسية
  specializations: Specialization[] = [];
  allSpecializations: Specialization[] = []; // للقائمة الجانبية

  // حالة التحميل والأخطاء
  loading: boolean = true;
  error: string = '';

  // البحث والتصفية
  searchTerm: string = '';
  selectedSpecializations: number[] = [];
  private searchSubject = new Subject<string>();

  // التصفح
  currentPage: number = 1;
  itemsPerPage: number = 3;
  totalPages: number = 1;
  totalItems: number = 0;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    // إعداد debounce للبحث
    this.setupSearchDebounce();
    this.loadFilterList();
    this.loadSpecializations();
  }

  private setupSearchDebounce() {
    this.searchSubject.pipe(
      debounceTime(300), // انتظر 300ms بعد آخر ضغطة
      distinctUntilChanged() // لا ترسل إذا القيمة لم تتغير
    ).subscribe(searchTerm => {
      this.currentPage = 1;
      this.loadSpecializations();
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
  loadSpecializations() {
    this.loading = true;
    this.error = '';

    let params = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('per_page', this.itemsPerPage.toString());

    // إضافة البحث إذا موجود
    if (this.searchTerm) {
      params = params.set('search', this.searchTerm);
    }

    // إضافة التخصصات المحددة إذا موجودة
    if (this.selectedSpecializations.length > 0) {
      params = params.set('specialization_ids', this.selectedSpecializations.join(','));
    }

    this.http.get<ApiResponse>('http://localhost:8000/api/specializations', { params })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.specializations = response.data.specializations;
            this.currentPage = response.data.pagination.current_page;
            this.totalPages = response.data.pagination.last_page;
            this.totalItems = response.data.pagination.total;
          } else {
            this.error = response.message || 'Failed to load specializations';
          }
          this.loading = false;
          this.cdr.detectChanges(); // تأكد من تحديث الواجهة
        },
        error: (error) => {
          this.error = 'Network error: Unable to connect to server';
          this.loading = false;
          console.error('Error loading specializations:', error);
          this.cdr.detectChanges(); // تأكد من تحديث الواجهة حتى في حالة الخطأ
        }
      });
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
    this.loadSpecializations();
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
    this.loadSpecializations();
  }

  // إزالة فلتر تخصص محدد
  removeSpecializationFilter(specId: number) {
    const index = this.selectedSpecializations.indexOf(specId);
    if (index > -1) {
      this.selectedSpecializations.splice(index, 1);
      this.currentPage = 1;
      this.loadSpecializations();
    }
  }

  // التصفح
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadSpecializations();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadSpecializations();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadSpecializations();
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

  // عرض تفاصيل التخصص
  viewSpecializationInfo(specialization: Specialization) {
    // التوجيه لصفحة الأطباء في هذا التخصص
    this.router.navigate(['/doctors'], {
      queryParams: { specialization_id: specialization.id }
    });
  }

  // تنظيف الاشتراكات عند تدمير المكون
  ngOnDestroy() {
    this.searchSubject.complete();
  }
}
