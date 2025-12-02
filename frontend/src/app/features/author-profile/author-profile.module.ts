import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthorProfileComponent } from './author-profile';
import { CoreModule } from '../../core/core-module';

const routes: Routes = [
  { path: '', component: AuthorProfileComponent }
];

@NgModule({
  declarations: [AuthorProfileComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    CoreModule
  ]
})
export class AuthorProfileModule { }

