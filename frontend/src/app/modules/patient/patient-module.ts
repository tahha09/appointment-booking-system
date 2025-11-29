import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { PatientProfile } from './profile/profile';
import { Dashboard } from './dashboard/dashboard';
import { authGuard } from '../../core/guards/auth-guard';

const routes: Routes = [
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'profile', component: PatientProfile, canActivate: [authGuard] },
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
