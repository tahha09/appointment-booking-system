export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  role: string;
  phone: string;
  date_of_birth: string;
  address: string;
  profile_image: string | null;
}

export interface Specialization {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface DoctorCertificate {
  id: number;
  doctor_id: number;
  title: string;
  description: string | null;
  issuing_organization: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  images: string[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface Doctor {
  id: number;
  user_id: number;
  specialization_id: number;
  license_number: string;
  experience_years: number;
  consultation_fee: string;
  biography: string;
  rating: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  user: User;
  specialization: Specialization;
  certificates?: DoctorCertificate[];
}

export interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface DoctorsListResponse {
  doctors: Doctor[];
  pagination: Pagination;
}

// Fix the DoctorResponse interface
export interface DoctorResponse {
  success: boolean;
  message: string;
  data: Doctor[] | DoctorsListResponse;
}
