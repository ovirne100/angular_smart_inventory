import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  // 🔗 URL del backend Laravel (ajusta si usas .env o proxy)
  private readonly API_URL = 'http://localhost:8000/api/dashboard/summary';

  constructor(private http: HttpClient) {}

  /**
   * 📊 Obtiene los datos del resumen del dashboard
   */
  getDashboardData(): Observable<any> {
    return this.http.get<any>(this.API_URL);
  }
}
