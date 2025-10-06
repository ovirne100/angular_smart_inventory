import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  collapsed = false;
  mobileOpen = false;

  constructor(private router: Router, private authService: AuthService) {}

  // Contadores de ejemplo
  productCount = 15;
  supplierCount = 8;
  movementCount = 23;
  alertCount = 5;

  ngOnInit() {
    // Verificar el estado inicial del sidebar desde localStorage
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      this.collapsed = JSON.parse(savedState);
    }

    // Verificar el tamaño de pantalla
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.checkScreenSize();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;

    // Cerrar sidebar móvil si se hace clic fuera
    if (window.innerWidth <= 768 && !target.closest('.sidebar') && !target.closest('.sidebar-toggle')) {
      this.mobileOpen = false;
    }
  }

  toggleSidebar() {
    if (window.innerWidth <= 768) {
      this.mobileOpen = !this.mobileOpen;
    } else {
      this.collapsed = !this.collapsed;
      localStorage.setItem('sidebar-collapsed', JSON.stringify(this.collapsed));
    }
  }

  closeMobileSidebar() {
    this.mobileOpen = false;
  }

  private checkScreenSize() {
    if (window.innerWidth <= 768) {
      this.mobileOpen = false;
    }
  }

  // Métodos para las herramientas
  exportData() {
    console.log('Exportando datos...');
    // Implementar lógica de exportación
  }

  importData() {
    console.log('Importando datos...');
    // Implementar lógica de importación
  }

  backupData() {
    console.log('Creando respaldo...');
    // Implementar lógica de respaldo
  }

  logout() {
    console.log('Cerrando sesión...');
    // Usar el servicio de autenticación para hacer logout correctamente
    this.authService.logout();
    // Redirigir siempre al registro
    this.router.navigate(['/register']);
  }
}
