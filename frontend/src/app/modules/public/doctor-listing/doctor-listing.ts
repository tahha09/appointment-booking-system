import { Component } from '@angular/core';
import { Header } from '../../../shared/components/header/header';
import { Footer } from '../../../shared/components/footer/footer';

@Component({
  selector: 'app-doctor-listing',
  standalone: true,
  imports: [Header, Footer],
  templateUrl: './doctor-listing.html',
  styleUrl: './doctor-listing.scss',
})
export class DoctorListing {

}
