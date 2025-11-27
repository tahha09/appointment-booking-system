import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './register/register';

const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes), Login, Register],
  exports: [RouterModule],
})
export class AuthModule {}
