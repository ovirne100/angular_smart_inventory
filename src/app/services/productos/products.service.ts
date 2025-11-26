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

  // STORAGE corregido para producción
  private storageUrl = `${environment.apiUrl.replace('/api', '')}/storage`;

  // Cache
  private productosCache: Producto[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000;
  private productosLoading$: Observable<{ data: Producto[] }> | null = null;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    });
  }

  // ============================================
  // GET PRODUCTS (con filtros + caché)
  // ============================================
  getProducts(filters: Record<string, any> = {}, forceRefresh: boolean = false): Observable<{ data: Producto[] }> {
    const token = localStorage.getItem('token');
    if (!token) {
      return throwError(() => new Error('Token no encontrado o expirado'));
    }

    const now = Date.now();
    const hasValidCache =
      this.productosCache &&
      (now - this.cacheTimestamp) < this.CACHE_DURATION &&
      !forceRefresh &&
      Object.keys(filters).length === 0;

    if (hasValidCache) {
      return of({ data: this.productosCache! });
    }

    if (this.productosLoading$ && !forceRefresh) {
      return this.productosLoading$;
    }

    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        params = params.append(key, filters[key]);
      }
    });

    this.productosLoading$ = this.http.get<any>(this.apiUrl, {
      headers: this.getAuthHeaders(),
      params
    }).pipe(
      map(response => {
        let productosArray: any[] = [];
        let paginationInfo: any = {};

        if (response.data && Array.isArray(response.data.data)) {
          productosArray = response.data.data;
          paginationInfo = {
            current_page: response.data.current_page,
            last_page: response.data.last_page,
            total: response.data.total,
            per_page: response.data.per_page
          };
        } else if (Array.isArray(response.data)) {
          productosArray = response.data;
          paginationInfo = {
            current_page: response.current_page,
            last_page: response.last_page,
            total: response.total,
            per_page: response.per_page
          };
        } else if (Array.isArray(response)) {
          productosArray = response;
        }

        const productosMapeados: Producto[] = productosArray.map((item: any) => {
          const proveedor =
            item.proveedor?.name ||
            item.supplier?.name ||
            (Array.isArray(item.suppliers) && item.suppliers.length > 0 ? item.suppliers[0]?.name : null) ||
            item.provider?.name ||
            'Sin proveedor';

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
            codigo_de_barras: codigoBarras,
            categoria: item.categoria || { name: 'Sin categoría' },
            expiration_date: this.parseExpirationDate(item.expiration_date),
            image_url: item.image ? `${this.storageUrl}/${item.image}` : undefined
          };
        });

        if (Object.keys(filters).length === 0) {
          this.productosCache = productosMapeados;
          this.cacheTimestamp = now;
        }

        this.productosLoading$ = null;

        return { data: productosMapeados, ...paginationInfo };
      }),
      catchError(err => {
        this.productosLoading$ = null;
        return throwError(() => err);
      })
    );

    return this.productosLoading$;
  }

  invalidateCache(): void {
    this.productosCache = null;
    this.cacheTimestamp = 0;
  }

  // ============================================
  // GET PRODUCTO POR ID
  // ============================================
  getProducto(id: number): Observable<Producto> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        const p = response.data || response;

        const expiration_date =
          p.expiration_date
            ? typeof p.expiration_date === 'string'
              ? p.expiration_date.substring(0, 10)
              : p.expiration_date instanceof Date
                ? p.expiration_date.toISOString().substring(0, 10)
                : null
            : null;

        const codigoBarras =
          p.codigo_de_barras ||
          p.codigo_barras ||
          p.barcode ||
          p.reference ||
          p.codigo ||
          undefined;

        return {
          ...p,
          codigo_de_barras: codigoBarras,
          expiration_date,
          categoria: p.categoria || { name: 'Sin categoría' },
          image_url: p.image ? `${this.storageUrl}/${p.image}` : undefined
        } as Producto;
      })
    );
  }

  // ============================================
  // CREAR PRODUCTO
  // ============================================
  crearProducto(producto: Partial<Producto> | FormData): Observable<Producto> {
    const token = localStorage.getItem('token');

    let headers: HttpHeaders;
    if (producto instanceof FormData) {
      headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    } else {
      headers = this.getAuthHeaders();
    }

    return this.http.post<any>(this.apiUrl, producto, { headers }).pipe(
      map(res => {
        const p = res.producto || res.data || res;
        this.invalidateCache();
        return {
          ...p,
          expiration_date: this.parseExpirationDate(p.expiration_date),
          image_url: p.image ? `${this.storageUrl}/${p.image}` : undefined
        };
      })
    );
  }

  // ============================================
  // ACTUALIZAR PRODUCTO
  // ============================================
  actualizarProducto(id: number, data: any): Observable<any> {
    const body = data instanceof FormData ? data : this.convertToFormData(data);
    const token = localStorage.getItem('token');

    let headers: HttpHeaders;
    if (body instanceof FormData) {
      headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      });
    } else {
      headers = this.getAuthHeaders();
    }

    return this.http.post<any>(`${this.apiUrl}/${id}?_method=PUT`, body, { headers }).pipe(
      map(res => {
        this.invalidateCache();
        return res;
      })
    );
  }

  // ============================================
  // ELIMINAR PRODUCTO
  // ============================================
  eliminarProducto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(res => {
        this.invalidateCache();
        return res;
      })
    );
  }

  // ============================================
  // BUSCAR POR CÓDIGO DE BARRAS
  // ============================================
  buscarPorCodigoBarras(codigo: string): Observable<Producto | null> {
    const codigoLimpio = codigo.trim().toLowerCase();

    if (!codigoLimpio) return of(null);

    return this.getProducts({ perPage: 1000 }).pipe(
      catchError(() => of({ data: [] })),
      map((response: any) => {
        const productos = Array.isArray(response.data) ? response.data : [];

        const exactMatch = productos.find((p: any) => {
          const c =
            p.codigo_de_barras ||
            p.codigo_barras ||
            p.barcode ||
            p.reference ||
            p.codigo;

          return c && String(c).trim().toLowerCase() === codigoLimpio;
        });

        if (exactMatch) return exactMatch;

        const partialMatch = productos.find((p: any) => {
          const c =
            p.codigo_de_barras ||
            p.codigo_barras ||
            p.barcode ||
            p.reference ||
            p.codigo;

          return c && String(c).trim().toLowerCase().includes(codigoLimpio);
        });

        if (partialMatch) return partialMatch;

        return productos.find((p: any) =>
          p.name?.trim().toLowerCase().includes(codigoLimpio)
        ) || null;
      })
    );
  }

  // ============================================
  // HELPERS
  // ============================================
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
