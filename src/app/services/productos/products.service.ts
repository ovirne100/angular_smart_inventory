import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Producto } from '../../interfaces/producto';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private apiUrl = 'http://127.0.0.1:8000/api/products';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    });
  }

  // ✅ Obtener todos los productos con filtros y paginación
  getProducts(filters: any = {}): Observable<any> {
    let params = new HttpParams();

    // si hay filtros, los agregamos como query params
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        params = params.append(key, filters[key]);
      }
    });

    return this.http.get<any>(this.apiUrl, { headers: this.getAuthHeaders(), params }).pipe(
      map(response => {
        const productos = response.data || response;

        // Si Laravel devuelve paginación, conserva todo el objeto
        const data = Array.isArray(productos)
          ? productos
          : response.data;

        const productosMapeados = data.map((item: any) => ({
          ...item,
          categoria: item.categoria || { name: 'Sin categoría' },
          image_url: item.image ? `http://127.0.0.1:8000/${item.image}` : null
        }));

        // si es paginación, conserva meta e info
        return response.data
          ? { ...response, data: productosMapeados }
          : productosMapeados;
      })
    );
  }

  // Obtener producto por ID
  getProducto(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() }).pipe(
      map((p: Producto) => ({
        ...p,
        expiration_date: p.expiration_date ? (p.expiration_date as string).substring(0, 10) : null,
        image_url: p.image ? `http://127.0.0.1:8000/${p.image}` : null
      }))
    );
  }

  // Crear producto
  crearProducto(producto: Partial<Producto>): Observable<Producto> {
    return this.http.post<any>(this.apiUrl, producto, { headers: this.getAuthHeaders() }).pipe(
      map(res => {
        const p = res.producto || res;
        return {
          ...p,
          categoria: p.categoria || null,
          image_url: p.image ? `http://127.0.0.1:8000/${p.image}` : null
        };
      })
    );
  }

  // Actualizar producto
  actualizarProducto(producto: Producto): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${producto.id}`, producto, { headers: this.getAuthHeaders() }).pipe(
      map((p: Producto) => ({
        ...p,
        image_url: p.image ? `http://127.0.0.1:8000/${p.image}` : null
      }))
    );
  }

  // Eliminar producto
  eliminarProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
