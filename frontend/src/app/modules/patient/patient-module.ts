import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { PatientProfile } from './profile/profile';
import { Dashboard } from './dashboard/dashboard';

const routes: Routes = [
  { path: 'dashboard', component: Dashboard },
  { path: 'profile', component: PatientProfile },
];


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    PatientProfile,
    Dashboard,
  ],
  exports: [RouterModule],
})
export class PatientModule { }
