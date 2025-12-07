import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './register/register';
import { AuthCallback } from './auth-callback/auth-callback';

const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'auth/callback', component: AuthCallback },
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes), Login, Register, AuthCallback],
  exports: [RouterModule],
})
export class AuthModule {}
