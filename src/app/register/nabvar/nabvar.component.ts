/*
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-nabvar',
  imports: [RouterLink],
  templateUrl: './nabvar.component.html',
  styleUrl: './nabvar.component.css'
})
export class NabvarComponent {

}
*/
// src/app/nabvar/nabvar.component.ts

import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Location } from '@angular/common';

@Component({
  selector: 'app-nabvar',
  templateUrl: './nabvar.component.html',
  styleUrls: ['./nabvar.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive]
})
export class NabvarComponent implements OnInit, OnDestroy {
  showLoginLink: boolean = false;
  isDashboard: boolean = false;
  isMobile: boolean = window.innerWidth <= 768;
  sidebarOculto: boolean = false;
  esPaginaExterna: boolean = false; // servicios, contacto, ayuda
  vieneDeDashboard: boolean = false; // si el usuario viene del dashboard

  // Pila de historial interno
  private routeHistory: string[] = [];

  // Listener para el evento del sidebar
  private sidebarListener = (e: any) => {
    this.sidebarOculto = e.detail.oculto;
  };

  constructor(private router: Router, private location: Location) {}

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth <= 768;
  }

  // Getter para mostrar el botón de menú
  get mostrarBotonMenu(): boolean {
    // Mostrar si: estamos en dashboard con sidebar oculto O en página externa viniendo del dashboard
    return (this.isDashboard && this.sidebarOculto) || (this.esPaginaExterna && this.vieneDeDashboard);
  }

  ngOnInit() {
    // Escuchar cambios del estado del sidebar
    window.addEventListener('sidebarEstado', this.sidebarListener);

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
        
        // Detectar si estamos en el dashboard
        const eraDashboard = this.isDashboard;
        this.isDashboard = url.startsWith('/dashboard');
        
        // Detectar si estamos en páginas externas
        this.esPaginaExterna = ['/servicios', '/contacto', '/ayuda'].includes(url);
        
        // Detectar si venimos del dashboard
        if (this.esPaginaExterna && eraDashboard) {
          this.vieneDeDashboard = true;
        } else if (this.isDashboard) {
          this.vieneDeDashboard = true;
        } else if (!this.esPaginaExterna) {
          this.vieneDeDashboard = false;
        }

        this.routeHistory.push(url);
        if (this.routeHistory.length > 50) {
          this.routeHistory.shift();
        }

        // Mostrar botón INGRESAR solo en /register
        this.showLoginLink = (url === '/register');
      });
  }

  ngOnDestroy() {
    window.removeEventListener('sidebarEstado', this.sidebarListener);
  }

  // Abrir menú del dashboard o navegar al dashboard
  abrirMenuDashboard() {
    if (this.esPaginaExterna) {
      // Si estamos en página externa, navegar al dashboard
      this.router.navigate(['/dashboard/inicio']);
    } else {
      // Si estamos en el dashboard, abrir el sidebar
      window.dispatchEvent(new CustomEvent('abrirMenuDashboard'));
    }
  }

  goBack() {
    // Remover la ruta actual de la pila
    this.routeHistory.pop();

    // La ruta anterior en la pila
    const previous = this.routeHistory.pop();

    if (previous) {
      // Navegar hacia la ruta anterior
      this.router.navigateByUrl(previous);
    } else {
      console.log('No hay ruta anterior en la pila');
    }
  }
}

