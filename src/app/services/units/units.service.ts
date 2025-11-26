import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Unit {
  id: number;
  name: string;
  abbreviation?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UnitsService {
  private apiUrl = `${environment.apiUrl}/units`;
  private storageKey = 'product_units';
  
  // Unidades predefinidas (fallback si el backend no está disponible)
  private defaultUnits: Unit[] = [
    { id: 1, name: 'Unidad', abbreviation: 'unidad' },
    { id: 2, name: 'Kilogramo', abbreviation: 'kg' },
    { id: 3, name: 'Gramo', abbreviation: 'g' },
    { id: 4, name: 'Litro', abbreviation: 'l' },
    { id: 5, name: 'Mililitro', abbreviation: 'ml' },
    { id: 6, name: 'Metro', abbreviation: 'm' },
    { id: 7, name: 'Centímetro', abbreviation: 'cm' },
    { id: 8, name: 'Caja', abbreviation: 'caja' },
    { id: 9, name: 'Paquete', abbreviation: 'paquete' },
    { id: 10, name: 'Botella', abbreviation: 'botella' },
    { id: 11, name: 'Bolsa', abbreviation: 'bolsa' },
    { id: 12, name: 'Lata', abbreviation: 'lata' },
  ];

  constructor(private http: HttpClient) {
    this.initializeUnits();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    const base = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    });
    return token ? base.set('Authorization', `Bearer ${token}`) : base;
  }

  /**
   * Inicializar unidades: cargar desde localStorage o usar las predefinidas
   */
  private initializeUnits(): void {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) {
      localStorage.setItem(this.storageKey, JSON.stringify(this.defaultUnits));
    }
  }

  /**
   * Obtener todas las unidades desde el backend (o localStorage si no existe el endpoint)
   */
  getUnits(): Observable<Unit[]> {
    return this.http.get<any>(this.apiUrl, { headers: this.getAuthHeaders() }).pipe(
      map(response => {
        const unitsArray = response.data || response || [];
        // Guardar en localStorage como caché
        if (unitsArray.length > 0) {
          localStorage.setItem(this.storageKey, JSON.stringify(unitsArray));
        }
        return unitsArray.length > 0 ? unitsArray : this.defaultUnits;
      }),
      catchError((error: HttpErrorResponse) => {
        // Si el endpoint no existe (404) o no hay conexión (0), usar localStorage sin mostrar error
        if (error.status === 404 || error.status === 0) {
          // No mostrar logs para errores esperados (404 o conexión rechazada)
        } else {
          // Solo mostrar advertencia para otros errores
          console.warn('⚠️ Error al cargar unidades desde backend, usando fallback:', error.status);
        }
        // Intentar cargar desde localStorage
        try {
          const stored = localStorage.getItem(this.storageKey);
          if (stored) {
            const units = JSON.parse(stored);
            return of(units.length > 0 ? units : this.defaultUnits);
          }
        } catch (e) {
          // Solo mostrar error si es un problema real con localStorage
          if (e instanceof SyntaxError) {
            console.error('Error al parsear unidades desde localStorage:', e);
          }
        }
        return of(this.defaultUnits);
      })
    );
  }

  /**
   * Obtener unidades (síncrono para uso en componentes)
   */
  getUnitsSync(): Unit[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error al cargar unidades desde localStorage:', error);
    }
    return [...this.defaultUnits];
  }

  /**
   * Crear nueva unidad (intenta en backend, si no existe guarda en localStorage)
   */
  createUnit(name: string, abbreviation?: string): Observable<Unit> {
    const nombreLimpio = name.trim();
    const abreviaturaLimpia = abbreviation?.trim() || nombreLimpio.toLowerCase();

    if (!nombreLimpio) {
      return throwError(() => new Error('El nombre de la unidad no puede estar vacío'));
    }

    // Verificar si ya existe localmente
    const units = this.getUnitsSync();
    const existe = units.some(u => 
      u.name.toLowerCase() === nombreLimpio.toLowerCase() ||
      u.abbreviation?.toLowerCase() === abreviaturaLimpia.toLowerCase()
    );

    if (existe) {
      const existente = units.find(u => 
        u.name.toLowerCase() === nombreLimpio.toLowerCase() ||
        u.abbreviation?.toLowerCase() === abreviaturaLimpia.toLowerCase()
      );
      if (existente) {
        return of(existente);
      }
    }

    const payload = {
      name: nombreLimpio,
      abbreviation: abreviaturaLimpia
    };

    // Intentar crear en el backend
    return this.http.post<any>(this.apiUrl, payload, { headers: this.getAuthHeaders() }).pipe(
      map(response => {
        const unidad = response.data || response.unit || response;
        
        if (!unidad || !unidad.id) {
          throw new Error('Respuesta inválida del servidor al crear unidad');
        }

        // Actualizar localStorage
        const units = this.getUnitsSync();
        const yaExiste = units.some(u => u.id === unidad.id);
        if (!yaExiste) {
          units.push(unidad);
          localStorage.setItem(this.storageKey, JSON.stringify(units));
        }

        return {
          id: unidad.id,
          name: unidad.name || nombreLimpio,
          abbreviation: unidad.abbreviation || abreviaturaLimpia
        } as Unit;
      }),
      catchError((error: HttpErrorResponse) => {
        // Si el endpoint no existe (404) o no hay conexión (0), guardar localmente sin error
        if (error.status === 404 || error.status === 0) {
          // No mostrar logs para errores esperados
          const units = this.getUnitsSync();
          const maxId = units.length > 0 ? Math.max(...units.map(u => u.id)) : 0;
          const nuevaUnidad: Unit = {
            id: maxId + 1,
            name: nombreLimpio,
            abbreviation: abreviaturaLimpia
          };
          units.push(nuevaUnidad);
          localStorage.setItem(this.storageKey, JSON.stringify(units));
          return of(nuevaUnidad);
        }

        // Si el error es que ya existe, intentar encontrarla
        if (error.error?.message?.includes('ya existe') || error.status === 422) {
          const units = this.getUnitsSync();
          const existente = units.find(u => 
            u.name.toLowerCase() === nombreLimpio.toLowerCase() ||
            u.abbreviation?.toLowerCase() === abreviaturaLimpia.toLowerCase()
          );
          if (existente) {
            return of(existente);
          }
        }

        // Para otros errores, también guardar localmente como fallback
        // Solo mostrar advertencia si no es un error de conexión
        if (error.status !== 0) {
          console.warn('⚠️ Error al crear unidad en backend, guardando localmente:', error.status);
        }
        const units = this.getUnitsSync();
        const maxId = units.length > 0 ? Math.max(...units.map(u => u.id)) : 0;
        const nuevaUnidad: Unit = {
          id: maxId + 1,
          name: nombreLimpio,
          abbreviation: abreviaturaLimpia
        };
        units.push(nuevaUnidad);
        localStorage.setItem(this.storageKey, JSON.stringify(units));
        return of(nuevaUnidad);
      })
    );
  }

  /**
   * Buscar unidades por término
   */
  searchUnits(term: string): Unit[] {
    const units = this.getUnitsSync();
    if (!term || term.trim() === '') {
      return [];
    }
    
    const termLower = term.toLowerCase();
    return units.filter(u => 
      u.name.toLowerCase().includes(termLower) ||
      u.abbreviation?.toLowerCase().includes(termLower)
    );
   }

   /**
 * Obtener las unidades asociadas a un producto específico
 * (compatible con tu entrada.component.ts)
 */
getProductUnits(productId: number): Observable<Unit[]> {
  return this.http.get<any>(`${this.apiUrl}/product/${productId}`, {
    headers: this.getAuthHeaders()
  }).pipe(
    map(response => {
      const unitsArray = response.data || response || [];
      return unitsArray.length > 0 ? unitsArray : this.defaultUnits;
    }),
    catchError(() => {
      // Si falla, devuelve unidades default o localStorage
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const units = JSON.parse(stored);
        return of(units.length > 0 ? units : this.defaultUnits);
      }
      return of(this.defaultUnits);
    })
  );
}

}

