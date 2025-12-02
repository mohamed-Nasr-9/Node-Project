import { Component, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Restoreaccountservice } from '../RestoreAccountService/restoreaccountservice';

@Component({
  selector: 'app-request-restore-account',
  standalone: false,
  templateUrl: './request-restore-account.html',
  styleUrls: ['./request-restore-account.css'],
})
export class RequestRestoreAccount implements OnDestroy {
  restoreAccountForm: FormGroup;
  isLoading = false;
  message = '';
  isError = false;
  private messageTimer: any = null;

  constructor(
    private fb: FormBuilder,
    private restoreAccountService: Restoreaccountservice
  ) {
    this.restoreAccountForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
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

  onSubmit() {
    if (!this.restoreAccountForm.valid) {
      this.restoreAccountForm.markAllAsTouched();
      return;
    }
    
    this.isLoading = true;
    this.isError = false;
    this.message = '';
    
    const email = this.restoreAccountForm.get('email')?.value;
    this.restoreAccountService.requestRestoreAccount(email).subscribe({
      next: (res) => {
        this.message = res.message || 'Restore link sent to your email';
        this.isLoading = false;
        this.isError = false;
        this.startAutoCloseTimer();
      },
      error: (err) => {
        console.error('Request restore account error:', err);
        let errorMessage = 'Failed to send restore link';
        
        if (err?.error?.error) {
          errorMessage = err.error.error;
        } else if (err?.error?.message) {
          errorMessage = err.error.message;
        } else if (err?.message) {
          errorMessage = err.message;
        }
        
        // Handle specific error statuses
        if (err?.status === 400) {
          errorMessage = err?.error?.error || 'Invalid request. Please check your email.';
        } else if (err?.status === 404) {
          errorMessage = err?.error?.error || 'User not found with this email.';
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
}

