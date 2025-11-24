import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Headers con autenticación
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    });
  }

  // Obtener productos con movimientos (entradas y salidas)
  getProductos(from?: string, to?: string): Observable<any[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<any[]>(`${this.base}/products`, {
      params,
      headers: this.getAuthHeaders()
    }).pipe(
      map((response: any) => {
        // Extraer el array de productos
        return response.data?.data || response.data || response || [];
      })
    );
  }

  // Obtener alertas
  getAlertas(from?: string, to?: string): Observable<any[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<any[]>(`${this.base}/alerts`, {
      params,
      headers: this.getAuthHeaders()
    }).pipe(
      map((response: any) => {
        return response.data || response || [];
      })
    );
  }

  // Obtener inventario con stock actual (con rango de fechas)
  getInventory(from?: string, to?: string): Observable<any[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<any[]>(`${this.base}/inventories`, {
      params,
      headers: this.getAuthHeaders()
    }).pipe(
      map((response: any) => {
        return response.data || response || [];
      })
    );
  }

  // Exportar productos a Excel
  exportProductsExcel(from?: string, to?: string) {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get(`${this.base}/reports/products/export/excel`, {
      params,
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  // Exportar productos a PDF
  exportProductsPdf(from?: string, to?: string) {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get(`${this.base}/reports/products/export/pdf`, {
      params,
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }
}
