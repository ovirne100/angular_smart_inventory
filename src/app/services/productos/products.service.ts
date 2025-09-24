// src/app/services/productos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from '../../interfaces/producto'; // 👈 interfaz

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private apiUrl = 'http://127.0.0.1:8000/api/products'; // 👈 Ajusta según tu backend

  constructor(private http: HttpClient) {}

  // ✅ Obtener todos los productos
  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  // ✅ Obtener un producto por ID
  getProductoById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  // ✅ Crear producto
 /*
  crearProducto(data: Producto): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, data);
  }
*/
//crear producto con auth
crearProducto(producto: any): Observable<any> {
  return this.http.post<any>(this.apiUrl, producto);
}



  // ✅ Actualizar producto
  actualizarProducto(id: number, data: Producto): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${id}`, data);
  }

  // ✅ Eliminar producto
  eliminarProducto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
