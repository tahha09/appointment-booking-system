import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { Layout } from './layout/layout';
import { Dashboard } from './dashboard/dashboard';
import { PatientProfile } from './profile/profile';
import { MyAppointments } from './my-appointments/my-appointments';
import { MedicalHistory } from './medical-history/medical-history';
import { Prescriptions } from './prescriptions/prescriptions';
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
      { path: 'profile', component: PatientProfile },
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    Layout,
    Dashboard,
    PatientProfile,
    MyAppointments,
    MedicalHistory,
    Prescriptions,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class PatientModule { }
