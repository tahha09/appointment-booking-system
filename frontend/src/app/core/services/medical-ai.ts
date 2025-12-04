import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface MedicalQuery {
  query: string;
  user_type?: 'patient' | 'guest' | 'doctor' | 'admin';
}

export interface MedicalResponse {
  success: boolean;
  data: {
    answer: string;
    type: string;
    data?: any;
    suggested_actions: string[];
    disclaimer?: string;
  };
  analysis?: {
    query: string;
    type: string;
    urgency: string;
    extracted_symptoms: string[];
    possible_specializations: string[];
    is_emergency: boolean;
  };
  timestamp?: string;
}

export interface ExampleQuestion {
  question: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class MedicalAiService {
  private apiUrl = `${environment.apiUrl}/ai`;
  private currentSessionId: string | null = null;

  constructor(private http: HttpClient) {
    // Load session ID from localStorage
    this.currentSessionId = localStorage.getItem('medical_assistant_session');
  }

  ask(query: string, userType: string = 'guest'): Observable<MedicalResponse> {
    const payload: any = {
      query,
      user_type: userType
    };

    // Include session ID if available
    if (this.currentSessionId) {
      payload.session_id = this.currentSessionId;
    }

    return this.http.post<MedicalResponse>(`${this.apiUrl}/ask`, payload).pipe(
      // Extract and store session ID from response
      tap((response: any) => {
        if (response.session_id) {
          this.currentSessionId = response.session_id;
          localStorage.setItem('medical_assistant_session', response.session_id);
        }
      })
    );
  }

  getChatHistory(): Observable<{success: boolean, messages: any[], stats: any}> {
    if (!this.currentSessionId) {
      return of({success: false, messages: [], stats: {}});
    }

    return this.http.post<{success: boolean, messages: any[], stats: any}>(`${this.apiUrl}/history`, {
      session_id: this.currentSessionId
    });
  }

  getExamples(): Observable<{success: boolean, examples: ExampleQuestion[]}> {
    return this.http.get<{success: boolean, examples: ExampleQuestion[]}>(`${this.apiUrl}/examples`);
  }

  // Helper method for common queries
  getSpecializationInfo(specialization: string): Observable<MedicalResponse> {
    return this.ask(`Tell me about ${specialization}`);
  }

  getDoctorRecommendation(symptoms: string): Observable<MedicalResponse> {
    return this.ask(`Best doctor for ${symptoms}`);
  }

  getMedicalAdvice(symptoms: string): Observable<MedicalResponse> {
    return this.ask(`I have ${symptoms} what should I do`);
  }
}
