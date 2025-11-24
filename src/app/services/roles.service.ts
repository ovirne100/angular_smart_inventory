import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private apiUrl = `${environment.apiUrl}/roles-public`;

  constructor(private http: HttpClient) {}

  getPublicRoles(): Observable<any[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map((response) => {
        // El backend devuelve directamente un array
        if (Array.isArray(response)) {
          return response;
        }
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