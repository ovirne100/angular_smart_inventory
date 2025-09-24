import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,   // 👈 muy importante
  imports: [
    RouterOutlet,     // 👈 habilita <router-outlet>
    RouterLink,       // 👈 habilita routerLink
    RouterLinkActive  // 👈 habilita routerLinkActive
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {}
