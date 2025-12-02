import { Routes } from '@angular/router';
import { patientGuard } from './core/guards/patient-guard';
import { doctorGuard } from './core/guards/doctor-guard';
import { adminGuard } from './core/guards/admin-guard';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./modules/public/public-module').then((m) => m.PublicModule),
  },
  {
    path: '',
    loadChildren: () => import('./modules/auth/auth-module').then((m) => m.AuthModule),
  },
  {
    path: 'patient',
    loadChildren: () => import('./modules/patient/patient-module').then((m) => m.PatientModule),
    canActivate: [patientGuard],
  },
  {
    path: 'doctor',
    loadChildren: () => import('./modules/doctor/doctor-module').then((m) => m.DoctorModule),
    canActivate: [doctorGuard],
  },
  {
    path: 'admin',
    loadChildren: () => import('./modules/admin/admin-module').then((m) => m.AdminModule),
    canActivate: [adminGuard],
  },

];
