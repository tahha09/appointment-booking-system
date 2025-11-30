import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DoctorDashboardLayout } from './doctor-dashboard-layout/doctor-dashboard-layout';
import { DoctorOverview } from './overview/overview';
import { PatientsManagement } from './patients-management/patients-management';
import { MyAppointments } from './my-appointments/my-appointments';
import { Schedule } from './schedule/schedule';
import { FinancialPerformance } from './financial-performance/financial-performance';
import { Certificates } from './certificates/certificates';

const doctorRoutes: Routes = [
  {
    path: '',
    component: DoctorDashboardLayout,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: DoctorOverview },
      { path: 'patients', component: PatientsManagement },
      { path: 'my-appointments', component: MyAppointments },
      { path: 'schedule', component: Schedule },
      { path: 'financial-performance', component: FinancialPerformance },
      { path: 'certificates', component: Certificates },
    ],
  },
];

@NgModule({
  declarations: [], // Empty declarations since all components are standalone
  imports: [
    CommonModule,
    // Import all standalone components
    DoctorDashboardLayout,
    DoctorOverview,
    PatientsManagement,
    MyAppointments,
    Schedule,
    FinancialPerformance,
    RouterModule.forChild(doctorRoutes)
  ],
  exports: [RouterModule]
})
export class DoctorModule {}
