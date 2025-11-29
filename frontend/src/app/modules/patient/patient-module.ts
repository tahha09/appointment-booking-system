import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { PatientProfile } from './profile/profile';
import { Dashboard } from './dashboard/dashboard';
import { Layout } from './layout/layout';
import { MyAppointments } from './my-appointments/my-appointments';
import { MedicalHistory } from './medical-history/medical-history';
import { Prescriptions } from './prescriptions/prescriptions';

const routes: Routes = [
  {
    path: '', component: Layout, children:[

  { path: 'dashboard', component: Dashboard },
  { path: 'my-appointments', component: MyAppointments},
  { path: 'medical-history', component: MedicalHistory},
  { path: 'prescriptions', component: Prescriptions},
  { path: 'profile', component: PatientProfile },
  ]
  }
];


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    Layout,
    MyAppointments,
    MedicalHistory,
    Prescriptions,
    PatientProfile,
    Dashboard,
  ],
  exports: [RouterModule],
})
export class PatientModule { }
