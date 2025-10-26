import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Proveedor, Producto } from '../../interfaces/producto';

@Injectable({
  providedIn: 'root'
})
export class SuppliersService {
  private apiUrl = 'http://smart_inventory/api';

  constructor(private http: HttpClient) {}

  // Obtener todos los proveedores
  getSuppliers(): Observable<{ data: Proveedor[] }> {
    return this.http.get<{ data: Proveedor[] }>(`${this.apiUrl}/suppliers`);
  }

  // Obtener productos asociados a un proveedor
  getSupplierProducts(supplierId: number): Observable<{ data: Producto[] }> {
    return this.http.get<{ data: Producto[] }>(`${this.apiUrl}/suppliers/${supplierId}/products`);
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
