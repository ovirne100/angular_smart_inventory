import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AlertFilters {
  alert_type?: 'bajo_stock' | 'sin_stock';
  status?: 'pendiente' | 'resuelta';
}

export interface Alert {
  id: number;
  product_id: number;
  inventory_id: number;
  alert_type: 'bajo_stock' | 'sin_stock';
  status: 'pendiente' | 'resuelta';
  message: string;
  date: string;
  resolved_at: string | null;
  product?: {
    id: number;
    name: string;
  };
  inventory?: any;
}

export interface AlertResponse {
  status: string;
  message: string;
  data: Alert[];
}

@Injectable({
  providedIn: 'root'
})
export class AlertsService {
  private apiUrl = `${environment.apiUrl}/alerts`;

  constructor(private http: HttpClient) {}

  /**
   * 📋 Obtener alertas (todas o filtradas)
   */
  getAlerts(filters: AlertFilters = {}): Observable<AlertResponse> {
    let params = new HttpParams();

    if (filters.alert_type) {
      params = params.set('alert_type', filters.alert_type);
    }

    if (filters.status) {
      params = params.set('status', filters.status);
    }

    return this.http.get<AlertResponse>(this.apiUrl, { params });
  }

  /**
   * ✅ Resolver una alerta
   */
  resolveAlert(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/resolve`, {});
  }
}
