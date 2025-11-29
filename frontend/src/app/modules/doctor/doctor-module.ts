import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { Dashboard as DoctorDashboard } from './dashboard/dashboard';

const routes: Routes = [
  { path: 'dashboard', component: DoctorDashboard },
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes), DoctorDashboard],
  exports: [RouterModule],
})
export class DoctorModule {}
