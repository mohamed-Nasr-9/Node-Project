import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from './auth';
import { environment } from '../../../environments/environment.prod';

export interface AuthorFilters {
  status?: 'pending' | 'approved' | 'rejected' | 'revoked';
  q?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface AuthorsResponse {
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  items: any[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthorService {
  private readonly API_URL = environment.apiUrl + '/authors';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Fetch all authors (public, with optional filters)
  getAuthors(): Observable<any[]> {
    return this.http.get<any[]>(this.API_URL);
  }

  // List authors with pagination and filters (for admin)
  listAuthors(filters: AuthorFilters = {}): Observable<AuthorsResponse> {
    let params = new HttpParams();
    
    if (filters.status) params = params.set('status', filters.status);
    if (filters.q) params = params.set('q', filters.q);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.sort) params = params.set('sort', filters.sort);

    return this.http.get<AuthorsResponse>(this.API_URL, { params });
  }

  // Fetch a specific author by ID
  getAuthorById(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${id}`);
  }

  // Get current logged-in author's profile
  getMyAuthorProfile(): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    // If no token, return an error observable that can be handled
    if (!this.authService.isAuthenticated()) {
      return throwError(() => ({ error: { message: 'Not authenticated' } }));
    }
    return this.http.get<any>(`${this.API_URL}/me/profile`, { headers });
  }

  // Apply to become an author
  applyAsAuthor(name: string, bio: string): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    if (!this.authService.isAuthenticated()) {
      return throwError(() => ({ error: { message: 'Authentication required' } }));
    }
    return this.http.post<any>(`${this.API_URL}/apply`, { name, bio }, { headers });
  }

  // Admin: Approve an author
  approveAuthor(id: string, data?: { name?: string; bio?: string }): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    if (!this.authService.isAuthenticated()) {
      return throwError(() => ({ error: { message: 'Authentication required' } }));
    }
    return this.http.patch<any>(`${this.API_URL}/${id}/approve`, data || {}, { headers });
  }

  // Admin: Reject an author
  rejectAuthor(id: string, reason?: string): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    if (!this.authService.isAuthenticated()) {
      return throwError(() => ({ error: { message: 'Authentication required' } }));
    }
    return this.http.patch<any>(`${this.API_URL}/${id}/reject`, { reason: reason || '' }, { headers });
  }

  // Admin: Revoke an author (make them a user again)
  revokeAuthor(id: string, reason?: string): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    if (!this.authService.isAuthenticated()) {
      return throwError(() => ({ error: { message: 'Authentication required' } }));
    }
    return this.http.patch<any>(`${this.API_URL}/${id}/revoke`, { reason: reason || 'Revoked by admin' }, { headers });
  }
}

