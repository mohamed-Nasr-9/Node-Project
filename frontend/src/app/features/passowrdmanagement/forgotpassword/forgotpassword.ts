import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Forgetpasswordservice } from '../ForgetPasswordService/forgetpasswordservice';

@Component({
  selector: 'app-forgotpassword',
  standalone: false,
  templateUrl: './forgotpassword.html',
  styleUrls: ['./forgotpassword.css'],
})
export class Forgotpassword {

  forgotPasswordForm: FormGroup;
  isLoading = false;
  message = '';
  isError = false;

  constructor(
    private fb: FormBuilder,
    private forgotPasswordService: Forgetpasswordservice
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (!this.forgotPasswordForm.valid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }
    
    this.isLoading = true;
    this.isError = false;
    this.message = '';
    
    const email = this.forgotPasswordForm.get('email')?.value;
    this.forgotPasswordService.forgotPassword(email).subscribe({
      next: (res) => {
        this.message = 'Check your inbox for reset email';
        this.isLoading = false;
        this.isError = false;
      },
      error: (err) => {
        const backendMsg = err?.error?.error || err?.message || 'Failed to send reset email';
        this.message = backendMsg;
        this.isError = true;
        this.isLoading = false;
      }
    });
  }
}
