import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { Home } from './home/home';
import { Specialties } from './specialties/specialties';



const routes: Routes = [
  { path: '', component: Home },
  { path: 'specialties', component: Specialties},
  // ... other public routes
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes) // Add this line

  ],
  exports:[
    RouterModule
  ]
})
export class PublicModule { }
