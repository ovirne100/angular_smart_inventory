import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Producto } from '../../interfaces/producto';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private apiUrl = 'http://smart_inventory/api/products';

  constructor(private http: HttpClient) {}

  // ===================== HEADERS =====================
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    });
  }

  // ===================== OBTENER PRODUCTOS =====================
  getProducts(filters: Record<string, any> = {}): Observable<{ data: Producto[] }> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        params = params.append(key, filters[key]);
      }
    });

    return this.http.get<any>(this.apiUrl, { headers: this.getAuthHeaders(), params }).pipe(
      map(response => {
        const productosArray = Array.isArray(response.data?.data) ? response.data.data : [];

        const productosMapeados: Producto[] = productosArray.map((item: any) => ({
          ...item,
          categoria: item.categoria || { name: 'Sin categoría' },
          expiration_date: this.parseExpirationDate(item.expiration_date),
          image_url: item.image ? `http://smart_inventory/storage/${item.image}` : null
        }));

        return { ...response.data, data: productosMapeados };
      })
    );
  }

  // ===================== OBTENER PRODUCTO POR ID =====================
 // ===================== OBTENER PRODUCTO POR ID =====================
getProducto(id: number): Observable<Producto> {
  return this.http.get<Producto>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() }).pipe(
    map((p: Producto) => {
      const expiration_date =
        p.expiration_date
          ? (typeof p.expiration_date === 'string'
              ? p.expiration_date.substring(0, 10)
              : p.expiration_date instanceof Date
                ? p.expiration_date.toISOString().substring(0, 10)
                : null)
          : null;

      return {
        ...p,
        expiration_date,
        image_url: p.image ? `http://smart_inventory/storage/${p.image}` : null
      } as Producto;
    })
  );
}



  // ===================== CREAR PRODUCTO =====================
  crearProducto(producto: Partial<Producto>): Observable<Producto> {
    return this.http.post<any>(this.apiUrl, producto, { headers: this.getAuthHeaders() }).pipe(
      map(res => {
        const p = res.producto || res;
        return {
          ...p,
          categoria: p.categoria || null,
          expiration_date: this.parseExpirationDate(p.expiration_date),
          image_url: p.image ? `http://smart_inventory/storage/${p.image}` : null
        };
      })
    );
  }

  // ===================== ACTUALIZAR PRODUCTO =====================
  actualizarProducto(id: number, data: any): Observable<any> {
    const body = data instanceof FormData ? data : this.convertToFormData(data);
    return this.http.post<any>(`${this.apiUrl}/${id}?_method=PUT`, body, { headers: this.getAuthHeaders() });
  }

  // ===================== ELIMINAR PRODUCTO =====================
  eliminarProducto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
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
