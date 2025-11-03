import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RolesService {
  // Usar la misma URL base que AuthService
  private apiUrl = 'http://127.0.0.1:8000/api/roles-public';

  constructor(private http: HttpClient) {}

  getPublicRoles(): Observable<any[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map((response) => {
        // Si la respuesta viene como { data: [...] }
        if (response && response.data && Array.isArray(response.data)) {
          return response.data;
        }
        // Si viene directamente como array
        if (Array.isArray(response)) {
          return response;
        }
        // Si viene como objeto con otra estructura
        console.warn('Formato de respuesta de roles no reconocido:', response);
        return [];
      }),
      catchError((error) => {
        console.error('Error al obtener roles públicos:', error);
        return throwError(() => error);
      })
    );
  }
}
