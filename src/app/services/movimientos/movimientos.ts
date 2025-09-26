import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MovimientosService {
  private apiUrl = 'http://127.0.0.1:8000/api'; // URL de tu Laravel

  constructor(private http: HttpClient) {}

  // ENTRADAS
  getEntradas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/entries`);
  }

  createEntrada(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/entries`, data);
  }

  // SALIDAS
  getSalidas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/outputs`);
  }

  createSalida(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/outputs`, data);
  }
}
