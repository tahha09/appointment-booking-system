import { H } from '@angular/cdk/keycodes';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { he } from 'date-fns/locale';
import { Header } from '../../../shared/components/header/header';
import { Footer } from '../../../shared/components/footer/footer';

@Component({
  selector: 'app-specialties',
  imports: [CommonModule,Header,Footer],
  standalone: true,
  templateUrl: './specialties.html',
  styleUrl: './specialties.scss',
})
export class Specialties {

}
