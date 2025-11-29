import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Header } from "../../../shared/components/header/header";
import { Footer } from "../../../shared/components/footer/footer";

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule, RouterModule, Header, Footer],
  templateUrl: './about-us.html',
  styleUrl: './about-us.scss',
})
export class AboutUs {

}
