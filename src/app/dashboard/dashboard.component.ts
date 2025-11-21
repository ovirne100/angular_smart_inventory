import { Component, HostListener, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  isMobile: boolean = window.innerWidth <= 768;
  showSidebar: boolean = true;
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      // Guardar la URL actual para redirigir después del login
      const currentUrl = this.router.url;
      localStorage.setItem('returnUrl', currentUrl);
      this.router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
      return;
    }

    // Suscribirse a los cambios del usuario actual
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;

      // Si no hay usuario cargado pero hay token, intentar cargar la información
      if (!user && this.authService.isAuthenticated()) {
        this.authService.loadUserInfo().subscribe({
          next: (userData) => {
            this.currentUser = userData;
          },
          error: (err) => {
            console.error('Error cargando información del usuario:', err);
            // Si hay error, redirigir al registro
            this.authService.logout();
            this.router.navigate(['/register']);
          }
        });
      }
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.showSidebar = true; // en web siempre visible
    }
  }

  navegar() {
    if (this.isMobile) {
      this.showSidebar = false; // en móvil se oculta después de dar click
    }
  }

  mostrarMenu() {
    this.showSidebar = true; // 🔹 esta es la función que usa el botón "☰ Menú"
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/register']);
  }

  getFullName(): string {
    if (this.currentUser) {
      return `${this.currentUser.name} ${this.currentUser.lastname}`;
    }
    return '';
  }

  getUserRole(): string {
    return this.currentUser?.role?.name || '';
  }

  getInitials(): string {
    if (this.currentUser) {
      const firstName = this.currentUser.name.charAt(0).toUpperCase();
      const lastName = this.currentUser.lastname.charAt(0).toUpperCase();
      return firstName + lastName;
    }
    return 'U';
  }
}
