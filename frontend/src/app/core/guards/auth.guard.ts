import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }

    // Show notification with action button
    const snackBarRef = this.snackBar.open('Please login to access the cart', 'Login', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });

    // Navigate when user clicks "Login" button
    snackBarRef.onAction().subscribe(() => {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    });

    // Redirect to login with return URL (if user doesn't click the button)
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}

