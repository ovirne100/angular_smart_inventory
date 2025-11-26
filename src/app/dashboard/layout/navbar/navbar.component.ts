import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  menuOpen = false;
  userMenuOpen = false;
  notificationCount = 3;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {}

  // Efecto de scroll
  @HostListener('window:scroll')
  onWindowScroll() {
    const navbar = document.querySelector('.navbar');
    window.scrollY > 50 
      ? navbar?.classList.add('scrolled')
      : navbar?.classList.remove('scrolled');
  }

  // Cerrar menús al hacer clic fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;

    if (!target.closest('.user-profile')) {
      this.userMenuOpen = false;
    }

    if (!target.closest('.navbar-container')) {
      this.menuOpen = false;
    }
  }

  // Toggle menú móvil
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  // Toggle menú del usuario
  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }

  // Notificaciones
  toggleNotifications() {
    console.log('Mostrar notificaciones');
  }

  // Cerrar menú al tocar overlay
  closeMenu() {
    this.menuOpen = false;
  }

  // Logout del usuario
  logout() {
    this.authService.logout();
    this.router.navigate(['/register']);
  }
}
