import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BecomeAuthorComponent } from './become-author';
import { CoreModule } from '../../core/core-module';

const routes: Routes = [
  { path: '', component: BecomeAuthorComponent }
];

@NgModule({
  declarations: [BecomeAuthorComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    CoreModule
  ]
})
export class BecomeAuthorModule { }

