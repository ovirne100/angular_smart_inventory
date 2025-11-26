import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, map, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Category {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  // Usar la URL del environment (sin duplicar /api)
  private apiUrl = `${environment.apiUrl}/categories`;

  // Categorías predefinidas del frontend
  private frontendCategories: Category[] = [
    { id: 1, name: 'Electrónicos' },
    { id: 2, name: 'Ropa y Accesorios' },
    { id: 3, name: 'Hogar y Jardín' },
    { id: 4, name: 'Deportes y Fitness' },
    { id: 5, name: 'Libros y Medios' },
    { id: 6, name: 'Salud y Belleza' },
    { id: 7, name: 'Juguetes y Juegos' },
    { id: 8, name: 'Automotriz' },
    { id: 9, name: 'Alimentación' },
    { id: 10, name: 'Oficina y Escolar' },
    { id: 11, name: 'Tecnología' },
    { id: 12, name: 'Muebles' },
    { id: 13, name: 'Herramientas' },
    { id: 14, name: 'Jardinería' },
    { id: 15, name: 'Cocina' },
    { id: 16, name: 'Baño' },
    { id: 17, name: 'Dormitorio' },
    { id: 18, name: 'Salón' },
    { id: 19, name: 'Iluminación' },
    { id: 20, name: 'Decoración' },
    { id: 21, name: 'Textiles' },
    { id: 22, name: 'Alfombras' },
    { id: 23, name: 'Cortinas' },
    { id: 24, name: 'Electrodomésticos' },
    { id: 25, name: 'Climatización' },
    { id: 26, name: 'Seguridad' },
    { id: 27, name: 'Limpieza' },
    { id: 28, name: 'Organización' },
    { id: 29, name: 'Bricolaje' },
    { id: 30, name: 'Ferretería' },
    { id: 31, name: 'Aseo' },
  ];

  constructor(private http: HttpClient) {
    console.log('🔗 CategoriesService usando URL:', this.apiUrl);
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    const base = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });
    return token ? base.set('Authorization', `Bearer ${token}`) : base;
  }

  // Obtener categorías del backend
  getCategories(): Observable<Category[]> {
    console.log('📡 Obteniendo categorías desde:', this.apiUrl);
    return this.http.get<any>(this.apiUrl, { headers: this.getAuthHeaders() }).pipe(
      map(response => {
        console.log('✅ Categorías recibidas del backend:', response);
        return response.data || response;
      }),
      catchError(error => {
        console.warn('⚠️ Error al obtener categorías del backend, usando fallback:', error);
        return of(this.frontendCategories);
      })
    );
  }

  // Crear nueva categoría en el backend
  createCategory(name: string): Observable<Category> {
    const nombreLimpio = name.trim();

    if (!nombreLimpio) {
      return throwError(() => new Error('El nombre de la categoría no puede estar vacío'));
    }

    const payload = { name: nombreLimpio };
    console.log('📤 Creando categoría:', payload);

    return this.http.post<any>(this.apiUrl, payload, { headers: this.getAuthHeaders() }).pipe(
      map(response => {
        console.log('✅ Categoría creada:', response);
        const categoria = response.data || response.category || response;

        if (!categoria || !categoria.id) {
          throw new Error('Respuesta inválida del servidor al crear categoría');
        }

        return {
          id: categoria.id,
          name: categoria.name || nombreLimpio
        } as Category;
      }),
      catchError((error) => {
        console.error('❌ Error al crear categoría:', error);

        if (error.error?.errors?.name) {
          const errorMessage = Array.isArray(error.error.errors.name)
            ? error.error.errors.name[0]
            : error.error.errors.name;
          return throwError(() => ({
            message: errorMessage || 'Error al crear la categoría',
            error: error
          }));
        }

        const errorMessage = error.error?.message || error.message || 'Error desconocido al crear la categoría';
        return throwError(() => ({
          message: errorMessage,
          error: error
        }));
      })
    );
  }

  // Obtener categorías del frontend (para usar en el formulario)
  getFrontendCategories(): Category[] {
    return this.frontendCategories;
  }

  // Obtener categorías (intenta del backend, si falla usa las del frontend)
  getCategoriesSafe(): Observable<Category[]> {
    return this.getCategories().pipe(
      catchError(() => {
        console.log('🔄 Usando categorías del frontend como fallback');
        return of(this.frontendCategories);
      })
    );
  }

  // Inicializar categorías en el backend
  initializeCategories(): Observable<any> {
    const initUrl = `${environment.apiUrl}/categories/initialize`;
    console.log('🚀 Inicializando categorías en:', initUrl);
    
    return this.http.post(initUrl, {
      categories: this.frontendCategories
    }, { headers: this.getAuthHeaders() }).pipe(
      map(response => {
        console.log('✅ Categorías inicializadas:', response);
        return response;
      }),
      catchError(error => {
        console.warn('⚠️ Error al inicializar categorías:', error);
        return of({
          success: false,
          message: 'Error al inicializar categorías',
          data: this.frontendCategories
        });
      })
    );
  }

  // Manejar errores de manera elegante
  private handleError = (error: HttpErrorResponse): Observable<any> => {
    if (error.status === 0) {
      console.log('🔌 Backend no disponible, usando categorías locales');
      return of({
        success: false,
        message: 'Backend no disponible, usando categorías locales',
        data: this.frontendCategories
      });
    }

    if (error.status >= 500) {
      console.warn('⚠️ Error del servidor en CategoriesService:', error.status);
    } else if (error.status !== 404) {
      console.warn('⚠️ Error en CategoriesService:', error.status, error.message);
    }

    if (error.status >= 500) {
      return of({
        success: false,
        message: 'Backend no disponible, usando categorías locales',
        data: this.frontendCategories
      });
    }

    return of({
      success: false,
      message: error.error?.message || 'Error desconocido',
      error: error
    });
  }
}