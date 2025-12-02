import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidationErrors, ValidatorFn , FormBuilder } from '@angular/forms';
import { Registerservice } from '../registerService/registerservice'

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class Register {

  registerForm: FormGroup;
  constructor(private fb: FormBuilder , private RS:Registerservice, private router:Router) {
    this.registerForm = this.fb.group({
    FirstName: ['', [Validators.required, Validators.minLength(3)]],
    LastName: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [
      Validators.required,
      Validators.minLength(6),
      Validators.pattern('^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{6,}$')
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
  isLoading = false;
  message = '';
  isError = false;
  hidePassword: boolean = true;
  hideConfirmPassword: boolean = true;

  onSubmit() {
    if (!this.registerForm.valid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.isError = false;
    this.message = '';
    if (this.registerForm.valid) {
      const formData = this.registerForm.value;
     this.RS.userRegisteration(formData).subscribe({
      next:(res) =>{
       this.message = 'Registeration Successfully ';
        this.isLoading = false;
       this.isError = false;
       setTimeout(() => {
        this.message = 'Redirecting you  to login page...';
        this.router.navigate(['/features/login']);
       }, 2000);

      },
      error:(err)=>{
       // map backend errors to form for better UX
       const backendMsg = err?.error?.error || err?.message || 'Registeration Failed ';
       this.message = backendMsg;
       this.isError = true;
        this.isLoading = false;
      }
 
     })
    } else {
      // safety: shouldn't reach here due to early return
    }
  }
}
 


