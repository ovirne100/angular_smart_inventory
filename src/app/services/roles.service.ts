import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private apiUrl = 'http://smart_inventory/api/';

  constructor(private http: HttpClient) {}

  getPublicRoles(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl + 'roles-public');
  }
}
