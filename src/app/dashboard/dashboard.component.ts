import { Component, HostListener, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

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

  mostrarModalAvatar: boolean = false;
  imagenSeleccionada: File | null = null;
  previewImagen: string | null = null;
  subiendoImagen: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
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
