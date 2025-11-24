import { Component, HostListener, OnInit } from '@angular/core';

import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  menuOpen = false;
  userMenuOpen = false;
  notificationCount = 3; // Ejemplo de notificaciones

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    // Inicialización del componente
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;

    // Cerrar menú de usuario si se hace clic fuera
    if (!target.closest('.user-profile')) {
      this.userMenuOpen = false;
    }

    // Cerrar menú móvil si se hace clic fuera
    if (!target.closest('.navbar-container')) {
      this.menuOpen = false;
    }
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }

  toggleNotifications() {
    // Lógica para mostrar notificaciones
    console.log('Mostrar notificaciones');
  }

  // Método para manejar el scroll del navbar
  onScroll() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  }

  logout() {
    console.log('Cerrando sesión...');
    // Usar el servicio de autenticación para hacer logout correctamente
    this.authService.logout();
    // Redirigir siempre al registro
    this.router.navigate(['/register']);
  }
}
