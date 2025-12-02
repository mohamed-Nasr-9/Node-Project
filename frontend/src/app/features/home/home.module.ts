import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

import { CoreModule } from '../../core/core-module';
import { HomeComponent } from './home';  // Correct path to HomeComponent

const routes: Routes = [
  { path: '', component: HomeComponent }  // Add route for HomeComponent
];

@NgModule({
  declarations: [HomeComponent],  // Declare HomeComponent only here
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    CoreModule
  ]
})
export class HomeModule {}
