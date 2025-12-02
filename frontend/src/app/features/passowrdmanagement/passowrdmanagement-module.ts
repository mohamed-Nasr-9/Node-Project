import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PassowrdmanagementRoutingModule } from './passowrdmanagement-routing-module';
import { Forgotpassword } from './forgotpassword/forgotpassword';
import { Resetpassword } from './resetpassword/resetpassword';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [
    Forgotpassword,
    Resetpassword
  ],
  imports: [
    CommonModule,
    PassowrdmanagementRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule, 
    MatIconModule,
    MatCheckboxModule,
    MatCardModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ]
})
export class PassowrdmanagementModule { }
