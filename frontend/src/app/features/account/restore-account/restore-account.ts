import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Restoreaccountservice } from '../RestoreAccountService/restoreaccountservice';

@Component({
  selector: 'app-restore-account',
  standalone: false,
  templateUrl: './restore-account.html',
  styleUrls: ['./restore-account.css'],
})
export class RestoreAccount implements OnInit, OnDestroy {
  isLoading = false;
  message = '';
  isError = false;
  token: string = '';
  private messageTimer: any = null;

  constructor(
    private restoreAccountService: Restoreaccountservice,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get token from route params - use both snapshot and subscribe for reliability
    this.route.paramMap.subscribe(params => {
      this.token = params.get('token') || '';
      
      // Also try to get from snapshot as fallback
      if (!this.token) {
        this.token = this.route.snapshot.paramMap.get('token') || '';
      }
      
      // Decode token if it was encoded
      if (this.token) {
        try {
          this.token = decodeURIComponent(this.token);
        } catch (e) {
          console.warn('Token decoding failed, using as-is:', e);
        }
      }
      
      console.log('Token from route:', this.token); // Debug log
      
      if (!this.token || this.token.trim() === '') {
        this.message = 'Invalid restore token - token is missing';
        this.isError = true;
        this.isLoading = false;
        this.startAutoCloseTimer();
        return;
      }

      // Automatically restore account when component loads
      this.restoreAccount();
    });
  }

  ngOnDestroy() {
    this.clearMessageTimer();
  }

  private clearMessageTimer() {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
      this.messageTimer = null;
    }
  }

  private startAutoCloseTimer() {
    this.clearMessageTimer();
    if (this.message && !this.isLoading) {
      this.messageTimer = setTimeout(() => {
        this.closeMessage();
      }, 4000);
    }
  }

  closeMessage() {
    this.clearMessageTimer();
    this.message = '';
    this.isError = false;
    this.isLoading = false;
  }

  restoreAccount() {
    if (!this.token || this.token.trim() === '') {
      this.message = 'Invalid restore token';
      this.isError = true;
      this.isLoading = false;
      this.startAutoCloseTimer();
      return;
    }
    
    this.isLoading = true;
    this.isError = false;
    this.message = '';
    
    console.log('Restoring account with token:', this.token.substring(0, 10) + '...'); // Debug log
    
    this.restoreAccountService.restoreAccount(this.token).subscribe({
      next: (res) => {
        this.message = res.message || 'Account restored successfully! Redirecting to login page...';
        this.isLoading = false;
        this.isError = false;
        this.startAutoCloseTimer();
        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        console.error('Restore account error:', err);
        let errorMessage = 'Failed to restore account';
        
        if (err?.error?.error) {
          errorMessage = err.error.error;
        } else if (err?.error?.message) {
          errorMessage = err.error.message;
        } else if (err?.message) {
          errorMessage = err.message;
        }
        
        // Handle specific error statuses
        if (err?.status === 400) {
          errorMessage = err?.error?.error || 'Invalid or expired restore link';
        } else if (err?.status === 404) {
          errorMessage = err?.error?.error || 'User not found';
        } else if (err?.status === 500) {
          errorMessage = err?.error?.error || 'Server error. Please try again later.';
        }
        
        this.message = errorMessage;
        this.isError = true;
        this.isLoading = false;
        this.startAutoCloseTimer();
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}

