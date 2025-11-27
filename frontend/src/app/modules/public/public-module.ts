import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { Home } from './home/home';
import { Specialties } from './specialties/specialties';
import { AboutUs } from './about-us/about-us';
import { Contact } from './contact/contact';



const routes: Routes = [
  { path: '', component: Home },
  { path: 'specialties', component: Specialties},
  { path: 'about-us', component: AboutUs},
  { path: 'contact', component: Contact}

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
