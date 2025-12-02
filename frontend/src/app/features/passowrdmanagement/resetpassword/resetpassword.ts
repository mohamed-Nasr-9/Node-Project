import { Router, ActivatedRoute } from '@angular/router';
import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Resetpasswordservice } from '../ResetPasswordService/resetpasswordservice';

@Component({
  selector: 'app-resetpassword',
  standalone: false,
  templateUrl: './resetpassword.html',
  styleUrls: ['./resetpassword.css'],
})
export class Resetpassword {

  resetPasswordForm: FormGroup;
  isLoading = false;
  message = '';
  isError = false;
  token: string = '';
  hidePassword: boolean = true;
  hideConfirmPassword: boolean = true;

  constructor(
    private fb: FormBuilder,
    private resetPasswordService: Resetpasswordservice,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Get token from route params
    this.token = this.route.snapshot.paramMap.get('token') || '';
    
    this.resetPasswordForm = this.fb.group({
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$')
      ]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(form: FormGroup) {
    const passwordCtrl = form.get('password');
    const confirmCtrl = form.get('confirmPassword');
    const password = passwordCtrl?.value;
    const confirm = confirmCtrl?.value;

    // apply mismatch error directly on confirm control for realtime feedback
    if (confirmCtrl) {
      if (password && confirm && password !== confirm) {
        const existing = confirmCtrl.errors || {};
        confirmCtrl.setErrors({ ...existing, mismatch: true });
      } else {
        if (confirmCtrl.errors && 'mismatch' in confirmCtrl.errors) {
          const { mismatch, ...rest } = confirmCtrl.errors;
          confirmCtrl.setErrors(Object.keys(rest).length ? rest : null);
        }
      }
    }

    return password === confirm ? null : { mismatch: true };
  }

  onSubmit() {
    if (!this.resetPasswordForm.valid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }
    
    if (!this.token) {
      this.message = 'Invalid reset token';
      this.isError = true;
      return;
    }
    
    this.isLoading = true;
    this.isError = false;
    this.message = '';
    
    const password = this.resetPasswordForm.get('password')?.value;
    this.resetPasswordService.resetPassword(this.token, password).subscribe({
      next: (res) => {
        this.message = 'Password reset successfully!, Redirecting you to login page...';
        this.isLoading = false;
        this.isError = false;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        const backendMsg = err?.error?.error || err?.message || 'Failed to reset password';
        this.message = backendMsg;
        this.isError = true;
        this.isLoading = false;
      }
    });
  }
}
