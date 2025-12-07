import { Component, signal, HostListener, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('appointment-booking-system');
  showScrollTop = false;
  scrollProgress = 0;

  ngOnInit(): void {}

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop || 0;
    const height = doc.scrollHeight - doc.clientHeight;
    this.showScrollTop = height > 0 && scrollTop > 80;
    this.scrollProgress = height > 0 ? Math.min(100, Math.round((scrollTop / height) * 100)) : 0;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
