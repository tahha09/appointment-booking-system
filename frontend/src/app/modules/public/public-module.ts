import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { Home } from './home/home';
import { Services } from './services/services';
import { Specialties } from './specialties/specialties';
import { AboutUs } from './about-us/about-us';
import { Contact } from './contact/contact';
import { DoctorListing } from './doctor-listing/doctor-listing';
import { DoctorDetails } from './doctor-details/doctor-details';


const routes: Routes = [
  { path: '', component: Home },
  {path: 'doctors' ,component:DoctorListing},
  {path: 'services', component: Services},
  { path: 'specialties', component: Specialties},
  { path: 'about-us', component: AboutUs},
  { path: 'contact', component: Contact},
  {path : 'doctors/:id',component:DoctorDetails}

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
