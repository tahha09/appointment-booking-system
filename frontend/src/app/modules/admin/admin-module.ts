import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboard } from './admin-dashboard/admin-dashboard';
import { SystemOverview } from './system-overview/system-overview';
import { UserManagement } from './user-management/user-management';
import { AppointmentsAdmin } from './appointments-admin/appointments-admin';
import { AppointmentsAnalytics } from './appointments-analytics/appointments-analytics';

const adminRoutes: Routes = [
  {
    path: '',
    component: AdminDashboard,
    children: [
      { path: '', redirectTo: 'system-overview', pathMatch: 'full' },
      { path: 'system-overview', component: SystemOverview },
      { path: 'user-management', component: UserManagement },
      { path: 'appointments', component: AppointmentsAdmin },
      { path: 'appointments-analytics', component: AppointmentsAnalytics }
    ]
  }
];

@NgModule({
  declarations: [ // ✅ CORRECT: Declare components here
    AdminDashboard,
    SystemOverview,
    UserManagement,
    AppointmentsAdmin,
    AppointmentsAnalytics
  ],
  imports: [ // ✅ CORRECT: Import modules here
    CommonModule,
    RouterModule.forChild(adminRoutes)
  ],
  exports: [RouterModule]
})
export class AdminModule { }
