import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SuppliersService {
  private apiUrl = 'http://SMART_INVENTORY.api.test/api/suppliers';

  constructor(private http: HttpClient) {}

  getSuppliers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
