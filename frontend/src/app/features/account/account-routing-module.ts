import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RequestRestoreAccount } from './request-restore-account/request-restore-account';
import { UserProfile } from './user-profile/user-profile';
import { RestoreAccount } from './restore-account/restore-account';
const routes: Routes = [
  { path: 'request-restore-account', component: RequestRestoreAccount },
  { path: 'user-profile', component: UserProfile },
  {path: 'restored-account', component: RestoreAccount}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountRoutingModule { }
