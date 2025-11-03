import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Proveedor, Producto } from '../../interfaces/producto';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SuppliersService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Método privado para obtener headers de autenticación
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('⚠️ No hay token disponible en localStorage');
    }
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    });
  }

  // Obtener todos los proveedores
  getSuppliers(): Observable<{ data: Proveedor[] }> {
    return this.http.get<{ data: Proveedor[] }>(`${this.apiUrl}/suppliers`);
  }

  // Obtener productos asociados a un proveedor
  getSupplierProducts(supplierId: number): Observable<{ data: Producto[] }> {
    return this.http.get<{ data: Producto[] }>(`${this.apiUrl}/suppliers/${supplierId}/products`);
  }

  // Obtener proveedores asociados a un producto
  getSuppliersByProduct(productId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/products/${productId}/suppliers`, {
      headers: this.getAuthHeaders()
    });
  }

  // Asociar productos a un proveedor
  attachProduct(supplierId: number, payload: { products: any[] }): Observable<any> {
    return this.http.post(`${this.apiUrl}/suppliers/${supplierId}/products`, payload);
  }

  // Eliminar producto de un proveedor
  detachProduct(supplierId: number, productId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/suppliers/${supplierId}/products/${productId}`);
  }

  // Actualizar proveedor
  update(supplierId: number, data: Partial<Proveedor>): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.apiUrl}/suppliers/${supplierId}`, data);
  }

  // Crear proveedor
  create(data: Partial<Proveedor>): Observable<Proveedor> {
    return this.http.post<Proveedor>(`${this.apiUrl}/suppliers`, data);
  }

  // Eliminar proveedor
  delete(supplierId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/suppliers/${supplierId}`);
  }
}
