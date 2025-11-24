import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProductSupplier {
  id?: number;
  supplier_id: number;
  product_id: number;
  unit_cost?: number | null;
  supplier_reference?: string | null;

  supplier?: {
    supplier_id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  product?: {
    id: number;
    name: string;
    reference?: string;
    unit_measurement?: string;
    lot?: string;

  };
}

@Injectable({
  providedIn: 'root'
})
export class ProductSupplierService {
  private apiUrl = `${environment.apiUrl}/product-suppliers`;

  constructor(private http: HttpClient) {}

  // Obtener todas las relaciones
  getRelationships(): Observable<ProductSupplier[]> {
    return this.http.get<ProductSupplier[]>(this.apiUrl);
  }

  // Crear relación
  createRelationship(data: Partial<ProductSupplier>): Observable<ProductSupplier> {
    return this.http.post<ProductSupplier>(this.apiUrl, data);
  }

  // Obtener relación específica
  getRelationship(id: number): Observable<ProductSupplier> {
    return this.http.get<ProductSupplier>(`${this.apiUrl}/${id}`);
  }

  // Actualizar relación
  updateRelationship(id: number, data: Partial<ProductSupplier>): Observable<ProductSupplier> {
    return this.http.put<ProductSupplier>(`${this.apiUrl}/${id}`, data);
  }

  attachProductsToSupplier(supplierId: number, products: any[]): Observable<any> {
    return this.http.post(`${environment.apiUrl}/suppliers/${supplierId}/attach-products`, { products });
  }


}
