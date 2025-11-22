import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  id: number;
  name: string;
  lastname: string;
  email: string;
  image?: string;
  image_url?: string;
  role: {
    id: number;
    name: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Cargar usuario del localStorage al inicializar
    this.loadUserFromStorage();
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.setItem('token', response.token);
          // Si el backend devuelve información del usuario en el login
          if (response.user) {
            this.setCurrentUser(response.user);
          }
        }
      })
    );
  }

  // Obtener información del usuario actual
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/user`);
  }

  // Cargar información del usuario y guardarla
  loadUserInfo(): Observable<User> {
    return this.getCurrentUser().pipe(
      tap(user => {
        this.setCurrentUser(user);
      })
    );
  }

  // Establecer usuario actual
  private setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  // Actualizar usuario actual (método público)
  updateCurrentUser(user: User): void {
    this.setCurrentUser(user);
  }

  // Cargar usuario del localStorage
  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }

  // Obtener usuario actual (síncrono)
  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // Cerrar sesión
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  // Actualizar imagen del usuario
  updateUserImage(image: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', image);
    
    return this.http.post(`${this.apiUrl}/user/update-image`, formData).pipe(
      tap((response: any) => {
        if (response.user) {
          this.setCurrentUser(response.user);
        }
      })
    );
  }

  // Actualizar usuario
  updateUser(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/user`, data).pipe(
      tap((response: any) => {
        if (response.user) {
          this.setCurrentUser(response.user);
        }
      })
    );
  }
}
