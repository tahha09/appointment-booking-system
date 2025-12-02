import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { Layout } from './layout/layout';
import { Dashboard } from './dashboard/dashboard';
import { PatientProfile } from './profile/profile';
import { MyAppointments } from './my-appointments/my-appointments';
import { MedicalHistory } from './medical-history/medical-history';
import { Prescriptions } from './prescriptions/prescriptions';
import { AppointmentDetails } from './appointment-details/appointment-details';
import { authGuard } from '../../core/guards/auth-guard';

const routes: Routes = [
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'my-appointments', component: MyAppointments },
      { path: 'medical-history', component: MedicalHistory },
      { path: 'prescriptions', component: Prescriptions },
      { path: 'appointment-details/:id', component: AppointmentDetails},
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
      
    ]
  },
  { path: 'profile', component: PatientProfile },
];

@NgModule({
  declarations: [], // Empty declarations since all components are standalone
  imports: [
    CommonModule,
    // Import all standalone components
    Layout,
    Dashboard,
    PatientProfile,
    MyAppointments,
    MedicalHistory,
    Prescriptions,
    AppointmentDetails,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class PatientModule { }
