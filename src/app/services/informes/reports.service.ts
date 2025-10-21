import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private base = 'http://smart_inventory/api/reports'; // ajusta base

  constructor(private http: HttpClient) {}

  getProductos(from?: string, to?: string): Observable<any[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<any[]>(`${this.base}/products`, { params });
  }

  getAlertas(from?: string, to?: string): Observable<any[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<any[]>(`${this.base}/alerts`, { params });
  }

  getInventory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/inventory`);
  }

  exportProductsExcel(from?: string, to?: string) {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    // returns CSV stream
    return this.http.get(`${this.base}/products/export/excel`, { params, responseType: 'blob' });
  }

  exportProductsPdf(from?: string, to?: string) {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get(`${this.base}/products/export/pdf`, { params, responseType: 'blob' });
  }
}
