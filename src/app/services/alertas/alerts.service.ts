import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AlertsService {
  /** URL base del endpoint de alertas */
  private apiUrl = `${environment.apiUrl}/alerts`;

  private alertsSubject = new BehaviorSubject<any[]>([]);
  alerts$ = this.alertsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /** 🔹 Obtener todas las alertas */
  getAllAlerts(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  /** 🔹 Obtener alertas activas */
  getActiveAlerts(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?status=active`);
  }

  /** 🔹 Obtener alertas resueltas */
  getResolvedAlerts(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?status=resolved`);
  }

  /** 🔹 Obtener alertas de tipo Stock Bajo */
  getLowStockAlerts(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?alert_type=low_stock&status=active`);
  }

  /** 🔹 Obtener alertas críticas */
  getCriticalAlerts(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?alert_type=critical&status=active`);
  }

  /** 🔹 Crear nueva alerta */
  createAlert(alertData: any): Observable<any> {
    return this.http.post(this.apiUrl, alertData);
  }

  /** 🔹 Resolver alerta */
  resolveAlert(alertId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${alertId}/status`, { status: 'resolved' });
  }

  /** 🔹 Eliminar alerta */
  deleteAlert(alertId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${alertId}`);
  }

  /** 🔹 Refrescar lista reactiva */
  refreshAlerts(): void {
    this.getAllAlerts().subscribe({
      next: (response: any) => {
        const list = Array.isArray(response) ? response : response?.data || [];
        this.alertsSubject.next(list);
      },
      error: () => this.alertsSubject.next([])
    });
  }
}
