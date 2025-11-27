import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../../../shared/components/header/header';
import { Footer } from '../../../shared/components/footer/footer';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule,Header,Footer],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {

}
