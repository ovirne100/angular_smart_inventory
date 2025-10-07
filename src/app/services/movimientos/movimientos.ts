// src/app/dashboard/pages/movimientos/servicios/movimientos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  message: string;
  warning?: string | null;
  data: T;
}

// 📦 Tipos de entidades
export interface Entrada {
  id?: number;
  product_id: number;
  quantity: number;
  reason?: string;

}

export interface Salida {
  id?: number;
  product_id: number;
  quantity: number;
  reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MovimientosService {
    private apiUrl = environment.apiUrl; ;

  // ================== 📊 ENTRADAS ==================
  private entriesCountSubject = new BehaviorSubject<number>(0);
  entriesCount$ = this.entriesCountSubject.asObservable();

  private entriesQuantitySubject = new BehaviorSubject<number>(0);
  entriesQuantity$ = this.entriesQuantitySubject.asObservable();

  private lastEntryDateSubject = new BehaviorSubject<string | null>(null);
  lastEntryDate$ = this.lastEntryDateSubject.asObservable();

  // ================== 📊 SALIDAS ==================
  private outputsCountSubject = new BehaviorSubject<number>(0);
  outputsCount$ = this.outputsCountSubject.asObservable();

  private outputsQuantitySubject = new BehaviorSubject<number>(0);
  outputsQuantity$ = this.outputsQuantitySubject.asObservable();

  private lastOutputDateSubject = new BehaviorSubject<string | null>(null);
  lastOutputDate$ = this.lastOutputDateSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ================== ENTRADAS ==================
  getEntradas(params: any = {}): Observable<ApiResponse<Entrada[]>> {
    return this.http.get<ApiResponse<Entrada[]>>(`${this.apiUrl}/entries`, {
      params,
      headers: { 'Accept': 'application/json' }
    }).pipe(catchError(this.handleError));
  }

  createEntrada(data: Entrada): Observable<ApiResponse<Entrada>> {
    return this.http.post<ApiResponse<Entrada>>(`${this.apiUrl}/entries`, data, {
      headers: { 'Accept': 'application/json' }
    }).pipe(catchError(this.handleError));
  }

  refreshEntriesCount(): void {
    this.http.get<any>(`${this.apiUrl}/entries/summary`, {
      headers: { 'Accept': 'application/json' }
    }).subscribe({
      next: (res) => {
        this.entriesCountSubject.next(res.total_entries ?? 0);
        this.entriesQuantitySubject.next(res.total_quantity ?? 0);
        this.lastEntryDateSubject.next(res.last_entry_date ?? null);
      },
      error: () => {
        this.entriesCountSubject.next(0);
        this.entriesQuantitySubject.next(0);
        this.lastEntryDateSubject.next(null);
      }
    });
  }

  // ================== SALIDAS ==================
  getSalidas(params: any = {}): Observable<ApiResponse<Salida[]>> {
    return this.http.get<ApiResponse<Salida[]>>(`${this.apiUrl}/outputs`, {
      params,
      headers: { 'Accept': 'application/json' }
    }).pipe(catchError(this.handleError));
  }

  createSalida(data: Salida): Observable<ApiResponse<Salida>> {
    return this.http.post<ApiResponse<Salida>>(`${this.apiUrl}/outputs`, data, {
      headers: { 'Accept': 'application/json' }
    }).pipe(catchError(this.handleError));
  }

  refreshOutputsCount(): void {
    this.http.get<any>(`${this.apiUrl}/outputs/summary`, {
      headers: { 'Accept': 'application/json' }
    }).subscribe({
      next: (res) => {
        this.outputsCountSubject.next(res.total_outputs ?? 0);
        this.outputsQuantitySubject.next(res.total_quantity ?? 0);
        this.lastOutputDateSubject.next(res.last_output_date ?? null);
      },
      error: () => {
        this.outputsCountSubject.next(0);
        this.outputsQuantitySubject.next(0);
        this.lastOutputDateSubject.next(null);
      }
    });
  }

  // ================== MÉTODO CENTRAL ==================
  refreshCounts(): void {
    this.refreshEntriesCount();
    this.refreshOutputsCount();
  }

  // ================== MANEJO DE ERRORES ==================
  private handleError(error: HttpErrorResponse) {
    console.error('❌ Error en MovimientosService:', error);
    return throwError(() => error.error?.message || 'Error en el servidor');
  }
}
