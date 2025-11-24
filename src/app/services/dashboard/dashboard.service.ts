import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  // 🔗 URL del backend Laravel
  private readonly API_URL = `${environment.apiUrl}/dashboard/summary`;

  constructor(private http: HttpClient) {}

  /**
   * 📊 Obtiene los datos del resumen del dashboard
   */
  getDashboardData(): Observable<any> {
    return this.http.get<any>(this.API_URL);
  }
}
