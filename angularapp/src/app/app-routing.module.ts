import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './services/auth.guard';

// --- Auth Components ---
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';

// --- Nav Components ---
import { AdminnavComponent } from './components/adminnav/adminnav.component';
import { CustomernavComponent } from './components/customernav/customernav.component';

// --- Admin Components ---
import { DriverManagementComponent } from './components/driver-management/driver-management.component';
import { AdminViewDriversComponent } from './components/admin-view-drivers/admin-view-drivers.component';
import { AdminviewrequestsComponent } from './components/adminviewrequests/adminviewrequests.component';
import { AdminviewfeedbackComponent } from './components/adminviewfeedback/adminviewfeedback.component';

// --- Customer Components ---
import { HomePageComponent } from './components/home-page/home-page.component';
import { CustomerviewdriverComponent } from './components/customerviewdriver/customerviewdriver.component';
import { CustomerviewrequestedComponent } from './components/customerviewrequested/customerviewrequested.component';
import { CustomerpostfeedbackComponent } from './components/customerpostfeedback/customerpostfeedback.component';
import { CustomerviewfeedbackComponent } from './components/customerviewfeedback/customerviewfeedback.component';
import { CustomerRequestComponent } from './components/customer-request/customer-request.component';
import { ErrorComponent } from './components/error/error.component';
import { AdminHomeComponent } from './components/admin-home/admin-home.component';

const routes: Routes = [
  // 1. Initial page load redirect
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // 2. Public Accessibility
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },

  // 3. Role-based Navigation Shells
  { path: 'adminnav', component: AdminnavComponent, canActivate: [AuthGuard], data: { roles: ['admin'] } },
  { path: 'customernav', component: CustomernavComponent, canActivate: [AuthGuard], data: { roles: ['customer', 'user'] } },

  // 4. Admin Panel Features (only admin)
  { path: 'admin/home', component: AdminHomeComponent, canActivate: [AuthGuard], data: { roles: ['admin'] } },
  { path: 'admin/add-driver', component: DriverManagementComponent, canActivate: [AuthGuard], data: { roles: ['admin'] } },
  { path: 'admin/edit-driver/:id', component: DriverManagementComponent, canActivate: [AuthGuard], data: { roles: ['admin'] } },
  { path: 'admin/drivers', component: AdminViewDriversComponent, canActivate: [AuthGuard], data: { roles: ['admin'] } },
  { path: 'admin/requests', component: AdminviewrequestsComponent, canActivate: [AuthGuard], data: { roles: ['admin'] } },
  { path: 'admin/feedback', component: AdminviewfeedbackComponent, canActivate: [AuthGuard], data: { roles: ['admin'] } },

  // 5. Customer Portal Features (only customer/user)
  { path: 'customer/home', component: HomePageComponent, canActivate: [AuthGuard], data: { roles: ['customer', 'user'] } },
  { path: 'customer/available-drivers', component: CustomerviewdriverComponent, canActivate: [AuthGuard], data: { roles: ['customer', 'user'] } },
  { path: 'customer/my-requests', component: CustomerviewrequestedComponent, canActivate: [AuthGuard], data: { roles: ['customer', 'user'] } },
  { path: 'customer/request', component: CustomerRequestComponent, canActivate: [AuthGuard], data: { roles: ['customer', 'user'] } },
  { path: 'customer/request/:driverId', component: CustomerRequestComponent, canActivate: [AuthGuard], data: { roles: ['customer', 'user'] } },
  { path: 'customer/edit-request/:id', component: CustomerRequestComponent, canActivate: [AuthGuard], data: { roles: ['customer', 'user'] } },
  { path: 'customer/submit-feedback', component: CustomerpostfeedbackComponent, canActivate: [AuthGuard], data: { roles: ['customer', 'user'] } },
  { path: 'customer/feedback', component: CustomerviewfeedbackComponent, canActivate: [AuthGuard], data: { roles: ['customer', 'user'] } },

  // 6. Catch-all fallback
  { path: 'error', component: ErrorComponent },
  { path: '**', redirectTo: '/error' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }