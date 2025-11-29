import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

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
    canActivate: [authGuard],
  },
  {
    path: 'doctor',
    loadChildren: () => import('./modules/doctor/doctor-module').then((m) => m.DoctorModule),
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    loadChildren: () => import('./modules/admin/admin-module').then((m) => m.AdminModule),
    canActivate: [authGuard],
  },
];
