import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Producto } from '../../interfaces/producto';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private apiUrl = `${environment.apiUrl}/products`;
  private storageUrl = 'http://127.0.0.1:8000/storage';

  // Caché de productos para mejorar rendimiento
  private productosCache: Producto[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private productosLoading$: Observable<{ data: Producto[] }> | null = null;

  constructor(private http: HttpClient) {}

  // ===================== HEADERS =====================
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      // No mostrar warning si no hay token (puede ser intencional)
    }
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    });
  }

  // ===================== OBTENER PRODUCTOS =====================
  getProducts(filters: Record<string, any> = {}, forceRefresh: boolean = false): Observable<{ data: Producto[] }> {
    const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('Token no encontrado o expirado'));
    }

    // Verificar si hay caché válido y no se fuerza refresh
    const now = Date.now();
    const hasValidCache = this.productosCache &&
                         (now - this.cacheTimestamp) < this.CACHE_DURATION &&
                         !forceRefresh &&
                         Object.keys(filters).length === 0; // Solo usar caché si no hay filtros

    if (hasValidCache) {
      return of({ data: this.productosCache! });
    }

    // Si ya hay una petición en curso, reutilizarla
    if (this.productosLoading$ && !forceRefresh) {
      return this.productosLoading$;
    }

    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        params = params.append(key, filters[key]);
      }
    });

    // Crear la petición y compartirla
    this.productosLoading$ = this.http.get<any>(this.apiUrl, { headers: this.getAuthHeaders(), params }).pipe(
      map(response => {
        // Manejar diferentes estructuras de respuesta del backend
        let productosArray: any[] = [];
        let paginationInfo: any = {};

        // Laravel paginate devuelve: { data: [...], current_page, last_page, total, per_page }
        if (response.data && Array.isArray(response.data.data)) {
          // Estructura: { data: { data: [...], current_page, last_page, total, per_page } }
          productosArray = response.data.data;
          paginationInfo = {
            current_page: response.data.current_page,
            last_page: response.data.last_page,
            total: response.data.total,
            per_page: response.data.per_page
          };
        } else if (response.data && Array.isArray(response.data)) {
          // Estructura: { data: [...], current_page, last_page, total, per_page }
          productosArray = response.data;
          paginationInfo = {
            current_page: response.current_page,
            last_page: response.last_page,
            total: response.total,
            per_page: response.per_page
          };
        } else if (Array.isArray(response)) {
          // Estructura simple: [...]
          productosArray = response;
        }

        const productosMapeados: Producto[] = productosArray.map((item: any) => {
          // Detectar el proveedor desde distintas estructuras
          const proveedor =
            item.proveedor?.name ||
            item.supplier?.name ||
            (Array.isArray(item.suppliers) && item.suppliers.length > 0
              ? item.suppliers[0]?.name
              : null) ||
            item.provider?.name ||
            'Sin proveedor';

          // Detectar código de barras desde múltiples campos posibles del backend
          const codigoBarras =
            item.codigo_de_barras ||
            item.codigo_barras ||
            item.barcode ||
            item.reference ||
            item.codigo ||
            undefined;

          return {
            ...item,
            proveedor,
            // Asegurar que codigo_de_barras esté presente
            codigo_de_barras: codigoBarras,
            categoria: item.categoria || { name: 'Sin categoría' },
            expiration_date: this.parseExpirationDate(item.expiration_date),
            image_url: item.image ? `${this.storageUrl}/${item.image}` : undefined
          };
        });

        // Guardar en caché solo si no hay filtros
        if (Object.keys(filters).length === 0) {
          this.productosCache = productosMapeados;
          this.cacheTimestamp = now;
        }

        // Limpiar la petición compartida
        this.productosLoading$ = null;

        // Devolver datos con información de paginación
        return {
          data: productosMapeados,
          ...paginationInfo
        };
      }),
      catchError((error) => {
        this.productosLoading$ = null;
        return throwError(() => error);
      })
    );

    return this.productosLoading$;
  }

  // Invalidar caché cuando se crea/actualiza/elimina un producto
  invalidateCache(): void {
    this.productosCache = null;
    this.cacheTimestamp = 0;
  }

  // ===================== OBTENER PRODUCTO POR ID =====================
  getProducto(id: number): Observable<Producto> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() }).pipe(
      map((response: any) => {
        const p = response.data || response;
        const expiration_date =
          p.expiration_date
            ? typeof p.expiration_date === 'string'
              ? p.expiration_date.substring(0, 10)
              : p.expiration_date instanceof Date
                ? p.expiration_date.toISOString().substring(0, 10)
                : null
            : null;

        // Detectar código de barras desde múltiples campos posibles
        const codigoBarras =
          p.codigo_de_barras ||
          (p as any).codigo_barras ||
          (p as any).barcode ||
          p.reference ||
          (p as any).codigo ||
          undefined;

        return {
          ...p,
          codigo_de_barras: codigoBarras,
          expiration_date,
          categoria: p.categoria || (p.category_id ? null : { name: 'Sin categoría' }),
          image_url: p.image ? `${this.storageUrl}/${p.image}` : (p.image_url || undefined)
        } as Producto;
      })
    );
  }

  // ===================== CREAR PRODUCTO =====================
  crearProducto(producto: Partial<Producto> | FormData): Observable<Producto> {
    // Si es FormData, no establecer Content-Type (el navegador lo hace automáticamente)
    const token = localStorage.getItem('token');
    let headers: HttpHeaders;

    if (producto instanceof FormData) {
      headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
        // No establecer Content-Type para FormData
      });
    } else {
      headers = this.getAuthHeaders();
    }

    return this.http.post<any>(this.apiUrl, producto, { headers }).pipe(
      map(res => {
        const p = res.producto || res.data || res;
        // Invalidar caché después de crear un producto
        this.invalidateCache();
        return {
          ...p,
          categoria: p.categoria || null,
          expiration_date: this.parseExpirationDate(p.expiration_date),
          image_url: p.image ? `${this.storageUrl}/${p.image}` : undefined
        };
      })
    );
  }

  // ===================== ACTUALIZAR PRODUCTO =====================
  actualizarProducto(id: number, data: any): Observable<any> {
    const body = data instanceof FormData ? data : this.convertToFormData(data);
    const token = localStorage.getItem('token');
    
    // Para FormData, no establecer Content-Type (el navegador lo hace automáticamente)
    let headers: HttpHeaders;
    if (body instanceof FormData) {
      headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
        // No establecer Content-Type para FormData
      });
    } else {
      headers = this.getAuthHeaders();
    }
    
    return this.http.post<any>(`${this.apiUrl}/${id}?_method=PUT`, body, { headers }).pipe(
      map(res => {
        // Invalidar caché después de actualizar un producto
        this.invalidateCache();
        return res;
      })
    );
  }

  // ===================== ELIMINAR PRODUCTO =====================
  eliminarProducto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() }).pipe(
      map(res => {
        // Invalidar caché después de eliminar un producto
        this.invalidateCache();
        return res;
      })
    );
  }

  // ===================== BUSCAR PRODUCTO POR CÓDIGO DE BARRAS =====================
  buscarPorCodigoBarras(codigo: string): Observable<Producto | null> {
    const codigoLimpio = codigo.trim();

    if (!codigoLimpio) {
      return of(null);
    }

    // Usar caché si está disponible, sino cargar productos (usará caché si existe)
    return this.getProducts({ perPage: 1000 }).pipe(
      catchError((error: any) => {
        // Si hay error, devolver array vacío para que el componente maneje el error
        return of({ data: [] });
      }),
      map((response: any) => {
        const productos = (response && Array.isArray(response.data)) ? response.data : [];
        const codigoBuscadoLower = codigoLimpio.toLowerCase();

        // Buscar coincidencia exacta en codigo_de_barras - PRIORITARIO
        let producto = productos.find((p: Producto) => {
          const codigoBarras =
            p.codigo_de_barras ||
            (p as any).codigo_barras ||
            (p as any).barcode ||
            (p as any).reference ||
            (p as any).codigo;

          if (!codigoBarras) return false;

          return String(codigoBarras).trim().toLowerCase() === codigoBuscadoLower;
        });

        if (producto) {
          return producto;
        }

        // Si no se encuentra con coincidencia exacta, intentar búsqueda parcial
        producto = productos.find((p: Producto) => {
          const codigoBarras =
            p.codigo_de_barras ||
            (p as any).codigo_barras ||
            (p as any).barcode ||
            (p as any).reference ||
            (p as any).codigo;
          if (!codigoBarras) return false;
          return String(codigoBarras).trim().toLowerCase().includes(codigoBuscadoLower);
        });

        if (producto) {
          return producto;
        }

        // Si aún no se encuentra, buscar por nombre que contenga el código (último recurso)
        producto = productos.find((p: Producto) => {
          if (!p.name) return false;
          return p.name.trim().toLowerCase().includes(codigoBuscadoLower);
        });

        return producto || null;
      })
    );
  }

  // ===================== HELPERS =====================
  private convertToFormData(obj: Record<string, any>): FormData {
    const formData = new FormData();
    for (const key in obj) {
      if (obj[key] !== null && obj[key] !== undefined) {
        formData.append(key, obj[key]);
      }
    }
    return formData;
  }

  private parseExpirationDate(date: string | Date | null | undefined): string | null {
    if (!date) return null;
    if (typeof date === 'string') return date.substring(0, 10);
    if (date instanceof Date) return date.toISOString().substring(0, 10);
    return null;
  }
}
