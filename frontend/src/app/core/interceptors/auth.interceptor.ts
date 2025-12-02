import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Check for token in localStorage (support both 'authToken' and 'auth_token' keys)
    const authToken = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
    
    // If token exists, check if it's expired before making the request
    if (authToken) {
      // Check if token is expired
      if (this.authService.isTokenExpired(authToken)) {
        // Token is expired, clear it and redirect to login
        this.authService.logout();
        localStorage.removeItem('authToken');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        
        this.router.navigate(['/login'], {
          queryParams: { 
            expired: 'true',
            returnUrl: this.router.url 
          }
        });
        
        // Return an error observable
        return throwError(() => new HttpErrorResponse({
          error: { message: 'Token expired' },
          status: 401,
          statusText: 'Unauthorized'
        }));
      }
      // For FormData requests, don't set Content-Type - let browser set it with boundary
      const clonedRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      return next.handle(clonedRequest).pipe(
        catchError((error: HttpErrorResponse) => {
          // Handle 401 Unauthorized (expired or invalid token)
          if (error.status === 401) {
            // Clear token and user data
            this.authService.logout();
            // Also clear the other token key if it exists
            localStorage.removeItem('authToken');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            
            // Redirect to login page
            this.router.navigate(['/login'], {
              queryParams: { 
                expired: 'true',
                returnUrl: this.router.url 
              }
            });
          }
          
          // Re-throw the error so it can be handled by the component
          return throwError(() => error);
        })
      );
    }
    
    // If no token, proceed with original request
    return next.handle(request);
  }
}

