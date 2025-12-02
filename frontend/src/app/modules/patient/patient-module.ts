import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { Layout } from './layout/layout';
import { Dashboard } from './dashboard/dashboard';
import { PatientProfile } from './profile/profile';
import { MyAppointments } from './my-appointments/my-appointments';
import { MedicalHistoryComponent } from './medical-history/medical-history';
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
      { path: 'medical-history', component: MedicalHistoryComponent },
      { path: 'prescriptions', component: Prescriptions },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: 'profile', component: PatientProfile },
];

@NgModule({
  // ✅ كل الكومبوننتس standalone → مفيش declarations
  declarations: [],
  imports: [
    CommonModule,
    // ✅ هنا تحط كل الـ standalone components
    Layout,
    Dashboard,
    PatientProfile,
    MyAppointments,
    MedicalHistoryComponent, // ✅ صح كده
    Prescriptions,
    RouterModule.forChild(routes),
  ],
  exports: [RouterModule]
})
export class PatientModule { }
