import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface Entrada {
  id?: number;
  producto: string;
  categoria: string;
  proveedor: string;
  fecha: string;
  lote: string;
  cantidad: string;
  ubicacion_interna: string;
  min_stock: number;
}

export interface Salida {
  id?: number;
  producto: string;
  categoria: string;
  usuario: string;
  cantidad: string;
  lote: string;
  inventario: number | null;
  fecha: string;
}

export interface EntrySummary {
  count: number;
  quantity: number;
  last_date: string | null;
}

export interface OutputSummary {
  total_salidas: number;
  total_cantidad: number;
  ultima_salida: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class MovimientosService {
  private apiUrl = environment.apiUrl;

  // ================== 📊 RESUMEN ENTRADAS ==================
  private entriesCountSubject = new BehaviorSubject<number>(0);
  entriesCount$ = this.entriesCountSubject.asObservable();

  private entriesQuantitySubject = new BehaviorSubject<number>(0);
  entriesQuantity$ = this.entriesQuantitySubject.asObservable();

  private lastEntryDateSubject = new BehaviorSubject<string | null>(null);
  lastEntryDate$ = this.lastEntryDateSubject.asObservable();

  // ================== 📊 RESUMEN SALIDAS ==================
  private outputsCountSubject = new BehaviorSubject<number>(0);
  outputsCount$ = this.outputsCountSubject.asObservable();

  private outputsQuantitySubject = new BehaviorSubject<number>(0);
  outputsQuantity$ = this.outputsQuantitySubject.asObservable();

  private lastOutputDateSubject = new BehaviorSubject<string | null>(null);
  lastOutputDate$ = this.lastOutputDateSubject.asObservable();

  // ================== 📋 LISTAS COMPLETAS ==================
  private entradasSubject = new BehaviorSubject<Entrada[]>([]);
  entradas$ = this.entradasSubject.asObservable();

  private salidasSubject = new BehaviorSubject<Salida[]>([]);
  salidas$ = this.salidasSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ================== ENTRADAS ==================
  getEntradas(params: any = {}): Observable<ApiResponse<Entrada[]>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        httpParams = httpParams.set(key, params[key]);
      }
    });

    return this.http.get<ApiResponse<Entrada[]>>(`${this.apiUrl}/entries`, {
      params: httpParams,
      headers: { 'Accept': 'application/json' }
    }).pipe(catchError(this.handleError));
  }

  getEntradasList(params: any = {}): void {
    this.getEntradas(params).subscribe({
      next: (res) => {
        console.log('📥 Entradas recibidas:', res);
        this.entradasSubject.next(res.data || []);
      },
      error: (err) => {
        console.error('❌ Error al cargar entradas completas:', err);
        this.entradasSubject.next([]);
      }
    });
  }

  refreshEntriesCount(): void {
    this.http.get<ApiResponse<EntrySummary>>(`${this.apiUrl}/entries/summary`, {
      headers: { 'Accept': 'application/json' }
    }).subscribe({
      next: (response) => {
        console.log('📊 Resumen entradas recibido:', response);
        this.entriesCountSubject.next(response.data.count ?? 0);
        this.entriesQuantitySubject.next(response.data.quantity ?? 0);
        this.lastEntryDateSubject.next(response.data.last_date ?? null);
      },
      error: (err) => {
        console.error('❌ Error al refrescar resumen de entradas', err);
        this.entriesCountSubject.next(0);
        this.entriesQuantitySubject.next(0);
        this.lastEntryDateSubject.next(null);
      }
    });
  }

  // ================== SALIDAS ==================
  getSalidas(params: any = {}): Observable<ApiResponse<Salida[]>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        httpParams = httpParams.set(key, params[key]);
      }
    });

    return this.http.get<ApiResponse<Salida[]>>(`${this.apiUrl}/outputs`, {
      params: httpParams,
      headers: { 'Accept': 'application/json' }
    }).pipe(catchError(this.handleError));
  }

  getSalidasList(params: any = {}): void {
    this.getSalidas(params).subscribe({
      next: (res) => {
        console.log('📤 Salidas recibidas:', res);
        this.salidasSubject.next(res.data || []);
      },
      error: (err) => {
        console.error('❌ Error al cargar salidas completas:', err);
        this.salidasSubject.next([]);
      }
    });
  }

  refreshOutputsCount(): void {
    this.http.get<ApiResponse<OutputSummary>>(`${this.apiUrl}/outputs/summary`, {
      headers: { 'Accept': 'application/json' }
    }).subscribe({
      next: (response) => {
        console.log('📊 Resumen salidas recibido:', response);
        this.outputsCountSubject.next(response.data.total_salidas ?? 0);
        this.outputsQuantitySubject.next(response.data.total_cantidad ?? 0);
        this.lastOutputDateSubject.next(response.data.ultima_salida ?? null);
      },
      error: (err) => {
        console.error('❌ Error al refrescar resumen de salidas', err);
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

  // ================== ERRORES ==================
  private handleError(error: HttpErrorResponse) {
    console.error('❌ Error en MovimientosService:', error);
    const message = error.error?.message || 'Error en el servidor.';
    return throwError(() => message);
  }
}
