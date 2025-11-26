import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Location {
  id: number;
  name: string;
  warehouse_id: number;
  warehouse?: {
    id: number;
    name: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class LocationsService {
  private apiUrl = `${environment.apiUrl}/locations`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  getLocations(): Observable<Location[]> {
    return this.http.get<any>(this.apiUrl, { headers: this.getAuthHeaders() }).pipe(
      map(response => response.data || response || [])
    );
  }

  getLocationsByWarehouse(warehouseId: number): Observable<Location[]> {
    return this.http.get<any>(`${this.apiUrl}?warehouse_id=${warehouseId}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      map(response => response.data || response || [])
    );
  }

  createLocation(data: { name: string; warehouse_id: number }): Observable<Location> {
    return this.http.post<any>(this.apiUrl, data, { headers: this.getAuthHeaders() }).pipe(
      map(response => response.data || response)
    );
  }

  updateLocation(id: number, data: { name: string; warehouse_id: number }): Observable<Location> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      map(response => response.data || response)
    );
  }

  deleteLocation(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { 
      headers: this.getAuthHeaders() 
    });
  }
}