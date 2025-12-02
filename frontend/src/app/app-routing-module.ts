import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaymentSuccess } from './features/cart/payment-success/payment-success';
import { PaymentFailed } from './features/cart/payment-failed/payment-failed';
import { AdminGuard } from './core/guards/admin.guard';

const routes: Routes = [
  { 
    path: '', 
    loadChildren: () => import('./features/home/home.module').then(m => m.HomeModule)  // Lazy load HomeModule
  },
  {
    path: 'book',
    loadChildren: () => import('./features/book-detail/book-detail.module').then(m => m.BookDetailModule)
  },
  {
    path: 'cart',
    loadChildren: () => import('./features/cart/cart.module').then(m => m.CartModule)
  },
  {
    path: 'dashboard',
    canActivate: [AdminGuard],
    loadChildren: () =>
      import('./features/dashboard/dashboard-module').then(m => m.DashboardModule)
  },

  {
    path: 'register',
    loadChildren: () => import('./features/registeration/registeration-module').then(m => m.RegisterationModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then(m => m.LoginModule)
  },
  {
    path: "password-management",
    loadChildren: () => import('./features/passowrdmanagement/passowrdmanagement-module').then(m => m.PassowrdmanagementModule)
  },
  {
    path: 'account',
    loadChildren: () => import('./features/account/account-module').then(m => m.AccountModule)
  },
  {
    path: 'author-profile',
    loadChildren: () =>
      import('./features/author-profile/author-profile.module').then(m => m.AuthorProfileModule)
  },
  {
    path: 'become-author',
    loadChildren: () =>
      import('./features/become-author/become-author.module').then(m => m.BecomeAuthorModule)
  },
  {
    path: 'review-authors',
    loadChildren: () =>
      import('./features/review-authors/review-authors.module').then(m => m.ReviewAuthorsModule)
  },
  {
    path: 'about',
    loadChildren: () =>
      import('./features/about/about.module').then(m => m.AboutModule)
  },
  {
    path: 'contact',
    loadChildren: () =>
      import('./features/contact/contact.module').then(m => m.ContactModule)
  },


];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
