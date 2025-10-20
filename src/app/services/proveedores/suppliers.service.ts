import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Supplier {
  supplier_id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  status?: string;
}

export interface SupplierProductPivot {
  unit_cost?: number | null;
  supplier_reference?: string | null;
}

export interface ProductWithCategory {
  product_id: number;
  name: string;
  category_id: number;
  categoria?: { id?: number; name: string };
  pivot?: SupplierProductPivot;
}

@Injectable({
  providedIn: 'root'
})
export class SuppliersService {
  private readonly baseUrl = 'http://smart_inventory/api';

  constructor(private http: HttpClient) { }

  list(params?: { search?: string; page?: number; perPage?: number }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.perPage) httpParams = httpParams.set('perPage', String(params.perPage));
    return this.http.get(`${this.baseUrl}/suppliers`, { params: httpParams });
  }

  get(id: number): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.baseUrl}/suppliers/${id}`);
  }

  create(payload: Partial<Supplier>): Observable<Supplier> {
    return this.http.post<Supplier>(`${this.baseUrl}/suppliers`, payload);
  }

  update(id: number, payload: Partial<Supplier>): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.baseUrl}/suppliers/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/suppliers/${id}`);
  }

  products(id: number): Observable<ProductWithCategory[]> {
    return this.http.get<ProductWithCategory[]>(`${this.baseUrl}/suppliers/${id}/products`);
  }

  attachProducts(id: number, products: Array<{ product_id: number; unit_cost?: number; supplier_reference?: string }>): Observable<any> {
    return this.http.post(`${this.baseUrl}/suppliers/${id}/products/attach`, { products });
  }

//  syncProducts(id: number, products: Array<{ product_id: number; unit_cost?: number; supplier_reference?: string }>): Observable<any> {
  //  return this.http.post(`${this.baseUrl}/suppliers/${id}/products`, { products });
  //}
/*
  detachProduct(id: number, productId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/suppliers/${id}/products/${productId}`);
  }
*/
  //asociar producto a proveedor
  attachProduct(data: any) {
    const { supplier_id, ...productData } = data;
    return this.http.post(`${this.baseUrl}/suppliers/${supplier_id}/products/attach`, {
      products: [productData]
    });
  }

  detachProduct(payload: { supplier_id: number; product_id: number }) {
    return this.http.post(`${this.baseUrl}/suppliers/detach-product`, payload);
  }

deleteRelationship(supplierId: number, productId: number) {
  return this.http.delete(`${this.baseUrl}/suppliers/${supplierId}/products/${productId}`);
}


}
