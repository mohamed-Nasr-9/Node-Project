import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Dashboard } from './dashboard';
import { DashboardLayout } from './layout/dashboard-layout/dashboard-layout';
import { Home } from './pages/home/home';
import { Orders } from './pages/orders/orders';
import { Books } from './pages/books/books';
import { ReviewAuthorsComponent } from '../review-authors/review-authors';
import { AdminGuard } from '../../core/guards/admin.guard';

const routes: Routes = [
  {
    path: '',
    component: DashboardLayout,
    canActivate: [AdminGuard],
    children: [
      { path: '', component: Home, canActivate: [AdminGuard] },
      { path: 'orders', component: Orders, canActivate: [AdminGuard] },
      { path: 'manage-books', component: Books, canActivate: [AdminGuard] },
      { path: 'review-authors', component: ReviewAuthorsComponent, canActivate: [AdminGuard] },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
