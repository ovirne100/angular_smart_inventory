import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { API_CONFIG, getApiUrl } from '../../config/api.config';

export interface Category {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  private apiUrl = API_CONFIG.BASE_URL;

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
    { id: 30, name: 'Ferretería' }
  ];

  constructor(private http: HttpClient) {}

  // Obtener categorías del backend
  getCategories(): Observable<Category[]> {
    return this.http.get<any>(getApiUrl(API_CONFIG.ENDPOINTS.CATEGORIES)).pipe(
      map(response => response.data || response),
      catchError(this.handleError)
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
    return this.http.post(getApiUrl(API_CONFIG.ENDPOINTS.CATEGORIES_INIT), {
      categories: this.frontendCategories
    }).pipe(
      catchError(this.handleError)
    );
  }


  // Manejar errores de manera elegante
  private handleError = (error: HttpErrorResponse): Observable<any> => {
    console.warn('⚠️ Error en CategoriesService:', error);

    // Si el backend no está disponible, devolver las categorías del frontend
    if (error.status === 0 || error.status >= 500) {
      console.log('🔄 Backend no disponible, usando categorías del frontend');
      return of({
        success: false,
        message: 'Backend no disponible, usando categorías locales',
        data: this.frontendCategories
      });
    }

    // Para otros errores, devolver el error
    return of({
      success: false,
      message: error.error?.message || 'Error desconocido',
      error: error
    });
  }
}
