import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Subscription, filter } from 'rxjs';

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
export class DashboardComponent implements OnInit, OnDestroy {
  isMobile: boolean = window.innerWidth <= 768;
  showSidebar: boolean = true;
  currentUser: User | null = null;

  mostrarModalAvatar: boolean = false;
  imagenSeleccionada: File | null = null;
  previewImagen: string | null = null;
  subiendoImagen: boolean = false;

  private routerSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  // Función para escuchar el evento del navbar
  private menuEventListener = () => this.mostrarMenu();

  ngOnInit() {
    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      // Guardar la URL actual para redirigir después del login
      const currentUrl = this.router.url;
      localStorage.setItem('returnUrl', currentUrl);
      this.router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
      return;
    }

    // Escuchar evento para abrir menú desde el navbar
    window.addEventListener('abrirMenuDashboard', this.menuEventListener);

    // Emitir estado inicial del sidebar
    this.emitirEstadoSidebar();

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

    // Suscribirse a los cambios de ruta para hacer scroll al top
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.scrollToTop();
      });
  }

  ngOnDestroy() {
    // Limpiar la suscripción al destruir el componente
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    // Remover el listener del evento
    window.removeEventListener('abrirMenuDashboard', this.menuEventListener);
  }

  scrollToTop(): void {
    // Usar requestAnimationFrame para asegurar que el DOM esté listo
    requestAnimationFrame(() => {
      // Intentar hacer scroll en el contenedor principal
      const mainElement = document.querySelector('.main');
      if (mainElement) {
        mainElement.scrollTo({ top: 0, behavior: 'smooth' });
      }
      
      // También hacer scroll en la ventana por si acaso
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Fallback adicional: hacer scroll instantáneo si smooth no funciona
      setTimeout(() => {
        if (mainElement) {
          mainElement.scrollTop = 0;
        }
        window.scrollTo(0, 0);
      }, 100);
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.showSidebar = true;
    }
    this.emitirEstadoSidebar();
  }

  navegar() {
    if (this.isMobile) {
      this.showSidebar = false;
      this.emitirEstadoSidebar();
    }
    // Hacer scroll al top cuando se navega (con un pequeño delay para asegurar que la navegación haya comenzado)
    setTimeout(() => {
      this.scrollToTop();
    }, 150);
  }

  // Navegar a rutas externas con scroll automático al top
  navegarConScroll(ruta: string): void {
    if (this.isMobile) {
      this.showSidebar = false;
      this.emitirEstadoSidebar();
    }
    this.router.navigate([ruta]).then(() => {
      // Scroll al top después de la navegación
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  }

  mostrarMenu() {
    this.showSidebar = true;
    this.emitirEstadoSidebar();
  }

  // Emitir estado del sidebar al navbar
  emitirEstadoSidebar() {
    const estaOculto = this.isMobile && !this.showSidebar;
    window.dispatchEvent(new CustomEvent('sidebarEstado', { 
      detail: { oculto: estaOculto } 
    }));
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

  getAvatarUrl(): string | null {
    if (this.currentUser?.image_url) {
      return this.currentUser.image_url;
    }
    if (this.currentUser?.image) {
      return `${environment.apiUrl.replace('/api', '')}/storage/${this.currentUser.image}`;
    }
    return null;
  }

  abrirModalAvatar(): void {
    this.mostrarModalAvatar = true;
    this.imagenSeleccionada = null;
    this.previewImagen = null;
  }

  cerrarModalAvatar(): void {
    this.mostrarModalAvatar = false;
    this.imagenSeleccionada = null;
    this.previewImagen = null;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecciona un archivo de imagen válido.');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen es demasiado grande. Por favor, selecciona una imagen menor a 5MB.');
        return;
      }

      this.imagenSeleccionada = file;

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImagen = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  subirImagen(): void {
    if (!this.imagenSeleccionada) {
      alert('Por favor, selecciona una imagen.');
      return;
    }

    this.subiendoImagen = true;
    const formData = new FormData();
    formData.append('image', this.imagenSeleccionada);

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.post(`${environment.apiUrl}/user/update-image`, formData, { headers })
      .subscribe({
        next: (response: any) => {
          if (response.user) {
            // Actualizar usuario en el servicio
            this.authService.updateCurrentUser(response.user);
            this.currentUser = response.user;
            alert('✅ Imagen actualizada correctamente');
            this.cerrarModalAvatar();
          }
          this.subiendoImagen = false;
        },
        error: (err) => {
          console.error('Error subiendo imagen:', err);
          alert('⚠️ Error al subir la imagen. Por favor, intenta nuevamente.');
          this.subiendoImagen = false;
        }
      });
  }

  eliminarImagen(): void {
    if (!confirm('¿Estás seguro de que quieres eliminar tu imagen de perfil?')) {
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.post(`${environment.apiUrl}/user/delete-image`, {}, { headers })
      .subscribe({
        next: (response: any) => {
          if (response.user) {
            // Actualizar usuario en el servicio
            this.authService.updateCurrentUser(response.user);
            this.currentUser = response.user;
            alert('✅ Imagen eliminada correctamente');
            this.cerrarModalAvatar();
          }
        },
        error: (err) => {
          console.error('Error eliminando imagen:', err);
          alert('⚠️ Error al eliminar la imagen. Por favor, intenta nuevamente.');
        }
      });
  }
}
