import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './register/register';
import { AuthCallback } from './auth-callback/auth-callback';
import { ForgotPassword } from './forgot-password/forgot-password';
import { ResetPassword } from './reset-password/reset-password';

const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'auth/callback', component: AuthCallback },
  { path: 'forgot-password', component: ForgotPassword },
  { path: 'reset-password', component: ResetPassword },
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes), Login, Register, AuthCallback, ForgotPassword, ResetPassword],
  exports: [RouterModule],
})
export class AuthModule {}
