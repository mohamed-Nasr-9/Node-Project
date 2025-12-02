import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Forgotpassword } from './forgotpassword/forgotpassword';
import { Resetpassword } from './resetpassword/resetpassword';

const routes: Routes = [
  { path: 'forgot-password', component: Forgotpassword },
  { path: 'reset-password/:token', component: Resetpassword }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PassowrdmanagementRoutingModule { }
