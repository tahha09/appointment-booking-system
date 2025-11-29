import { Routes } from '@angular/router';

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
  },
  {
    path: 'admin',
    loadChildren: () => import('./modules/admin/admin-module').then(m => m.AdminModule)
  },
  {
    path: 'doctor',
    loadChildren: () => import('./modules/doctor/doctor-module').then(m => m.DoctorModule)
  }
];
