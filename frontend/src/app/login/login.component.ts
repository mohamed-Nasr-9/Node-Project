import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../core/services/auth';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: false,
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  hidePassword: boolean = true;

  isLoading: boolean = false;
  errorMessage: string | null = null;
  expiredMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Check if redirected due to expired token
    this.route.queryParams.subscribe(params => {
      if (params['expired'] === 'true') {
        this.expiredMessage = 'Your session has expired. Please login again.';
        // Show snackbar notification
        this.snackBar.open('Your session has expired. Please login again.', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = null;

    const credentials = {
      email: this.email,
      password: this.password
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));

        // Check if user is admin and redirect to dashboard
        const userRole = response.user?.role?.toLowerCase();
        if (userRole === 'admin') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        
        if (err.status === 401) {
          this.errorMessage = err.error.error; 
        } else if (err.status === 500) {

          this.errorMessage = 'A server error occurred. Please try again later.';
        } else {
          this.errorMessage = 'An unexpected error occurred. Please check your connection.';
        }
        console.error('Login error:', err);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}