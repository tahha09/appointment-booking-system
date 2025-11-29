import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { Dashboard as AdminDashboard } from './dashboard/dashboard';

const routes: Routes = [
  { path: 'dashboard', component: AdminDashboard },
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes), AdminDashboard],
  exports: [RouterModule],
})
export class AdminModule {}
