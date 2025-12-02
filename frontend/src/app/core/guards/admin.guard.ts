import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // First check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.snackBar.open('Please login to access the dashboard', 'Login', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }).onAction().subscribe(() => {
        this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      });
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Check if user is admin
    const isAdmin = this.checkAdminStatus();
    
    if (!isAdmin) {
      this.snackBar.open('Access denied. Admin privileges required.', 'OK', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      this.router.navigate(['/']);
      return false;
    }

    return true;
  }

  private checkAdminStatus(): boolean {
    // Check if user is admin from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user?.role?.toLowerCase() === 'admin';
      } catch (e) {
        // If parsing fails, check token
      }
    }
    
    // Also check from token payload
    const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload?.role?.toLowerCase() === 'admin';
      } catch (e) {
        return false;
      }
    }
    
    return false;
  }
}

