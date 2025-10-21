import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

interface FormDataResponse {
  status: string;
  message: string;
  data: {
    productos: any[];
    inventarios: any[];
  };
}

interface CreateOutputResponse {
  status: string;
  message: string;
  data?: any;
}

@Component({
  selector: 'app-salida',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './salida.component.html',
  styleUrls: ['./salida.component.css']
})
export class SalidaComponent implements OnInit, OnDestroy {
  salidaForm!: FormGroup;
  showForm = false;
  saving = false;
  successMessage = '';
  errorMessage = '';
  warningMessage = '';

  productos: any[] = [];
  inventarios: any[] = [];

  private apiUrl = 'http://localhost:8000/api';
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.initForm();
    this.loadFormData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm() {
    this.salidaForm = this.fb.group({
      product_id: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(1)]],
      unit: [''],
      lot: [''],
    });
  }

  toggleForm() {
    this.showForm = !this.showForm;
    this.clearMessages();
  }

  private clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
    this.warningMessage = '';
  }

  loadFormData() {
    const headers = this.getAuthHeaders();
    this.http.get<FormDataResponse>(`${this.apiUrl}/outputs/form-data`, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          console.log('📦 Datos del formulario:', res);
          this.productos = res.data?.productos || [];
          this.inventarios = res.data?.inventarios || [];
        },
        error: err => {
          console.error('❌ Error cargando datos del formulario', err);
          this.errorMessage = err.error?.message || 'Error al cargar productos.';
        }
      });
  }

  onSubmit() {
    if (this.salidaForm.invalid) {
      this.warningMessage = '⚠️ Por favor completa todos los campos obligatorios.';
      return;
    }

    this.saving = true;
    this.clearMessages();

    // Normaliza tipos: IDs a número
    const payload = {
      product_id: Number(this.salidaForm.value.product_id),
      quantity: Number(this.salidaForm.value.quantity),
      unit: this.salidaForm.value.unit || null,
      lot: this.salidaForm.value.lot || null
    };

    console.log('📤 Enviando salida:', payload);

    this.http.post<CreateOutputResponse>(`${this.apiUrl}/outputs`, payload, { headers: this.getAuthHeaders() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          console.log('✅ Salida creada:', res);
          this.successMessage = res.message || '✅ Salida registrada correctamente.';
          this.resetForm();
          setTimeout(() => this.clearMessages(), 5000);
        },
        error: err => {
          console.error('❌ Error al registrar la salida:', err);
          // Mostrar detalle de validación si existe
          if (err.status === 422 && err.error?.errors) {
            // Laravel validation errors
            const errors = err.error.errors;
            this.errorMessage = Object.values(errors).flat().join(' ');
          } else if (err.error?.message) {
            this.errorMessage = err.error.message;
          } else {
            this.errorMessage = '❌ Error al registrar la salida.';
          }
        },
        complete: () => {
          this.saving = false;
        }
      });
  }

  private resetForm() {
    this.salidaForm.reset({ product_id: '', quantity: '', unit: '', lot: '' });
    this.salidaForm.markAsPristine();
    this.salidaForm.markAsUntouched();
    this.showForm = false;
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Accept': 'application/json' });
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }
}
