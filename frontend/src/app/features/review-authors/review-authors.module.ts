import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReviewAuthorsComponent } from './review-authors';

const routes: Routes = [
  { path: '', component: ReviewAuthorsComponent }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ]
})
export class ReviewAuthorsModule { }

