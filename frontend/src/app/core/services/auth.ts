import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private tokenKey = 'auth_token';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load token from localStorage on init
    const token = this.getToken();
    if (token) {
      // Optionally decode token to get user info
      this.loadUserFromToken(token);
    }
  }

  // Get token from localStorage
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Set token in localStorage
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  // Remove token from localStorage
  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
  }

  // Get authorization header
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
    }
    return new HttpHeaders();
  }

  // Load user info from token (basic implementation)
  private loadUserFromToken(token: string): void {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.currentUserSubject.next(payload);
    } catch (e) {
      console.error('Error decoding token:', e);
    }
  }

  // Check if token is expired
  isTokenExpired(token?: string): boolean {
    const tokenToCheck = token || this.getToken();
    if (!tokenToCheck) {
      return true;
    }

    try {
      const payload = JSON.parse(atob(tokenToCheck.split('.')[1]));
      const exp = payload.exp;
      
      if (!exp) {
        return false; // No expiration claim, assume valid
      }
      
      // exp is in seconds, Date.now() is in milliseconds
      const expirationTime = exp * 1000;
      const currentTime = Date.now();
      
      return currentTime >= expirationTime;
    } catch (e) {
      console.error('Error checking token expiration:', e);
      return true; // If we can't parse, consider it expired
    }
  }

  // Check if user is authenticated and token is valid
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    
    // Check if token is expired
    if (this.isTokenExpired(token)) {
      // Token is expired, clear it
      this.logout();
      return false;
    }
    
    return true;
  }

  // Login (if you have a login endpoint)
  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap(response => {
        if (response.token) {
          this.setToken(response.token);
          this.loadUserFromToken(response.token);
        }
      })
    );
  }

  // Logout
  logout(): void {
    this.removeToken();
  }
}

