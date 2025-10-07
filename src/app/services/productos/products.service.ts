import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Producto } from '../../interfaces/producto';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private apiUrl = 'http://smart_inventory/api/products';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    });
  }

  // Obtener todos los productos
  getProducts(): Observable<Producto[]> {
    return this.http.get<any>(this.apiUrl, { headers: this.getAuthHeaders() }).pipe(
      map(response => {
        const productos = response.data || response;
        return productos.map((item: any) => ({
          ...item,
          categoria: item.categoria || { name: 'Sin categoría' },
          image_url: item.image ? `http://smart_inventory/${item.image}` : null
        }));
      })
    );
  }

// Obtener producto por ID
getProducto(id: number): Observable<Producto> {
  return this.http.get<Producto>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() }).pipe(
    map((p: Producto) => {
      return {
        ...p,
        expiration_date: p.expiration_date ? (p.expiration_date as string).substring(0, 10) : null,
        image_url: p.image ? `http://smart_inventory/${p.image}` : null
      };
    })
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
          image_url: p.image ? `http://smart_inventory/${p.image}` : null
        };
      })
    );
  }

 // Actualizar producto
actualizarProducto(producto: Producto): Observable<Producto> {
  return this.http.put<Producto>(`${this.apiUrl}/${producto.id}`, producto, { headers: this.getAuthHeaders() }).pipe(
    map((p: Producto) => {
      return {
        ...p,
        image_url: p.image ? `http://smart_inventory/${p.image}` : null
      };
    })
  );
}

  // Eliminar producto
  eliminarProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}
